<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/lib/ApiClient'
import { parseLog } from '@/lib/logParser'
import { setPageTitle } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'
import '@/assets/LogsAnalysis.css'
import {
  WrapText,
  Search,
  Download,
  Trash2,
  Share2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  ArrowUp,
  Code,
  BookText
} from 'lucide-vue-next'

const route = useRoute()
const id = route.params.id as string
const log = ref<any>(null)
const logContent = ref('')
const loading = ref(true)
const error = ref('')
const showErrorsOnly = ref(false)
const wrapLines = ref(true)
const searchTerm = ref('')
const searchIndex = ref(0)
const searchResults = ref<number[]>([])
const isFullscreen = ref(false)
const isCopySuccess = ref(false)

onMounted(async () => {
  try {
    const [rawRes, insightsRes] = await Promise.all([
      apiClient.get(`/1/raw/${id}`),
      apiClient.get(`/1/insights/${id}`)
    ])

    log.value = insightsRes.data
    let rawText = typeof rawRes.data === 'string' ? rawRes.data : JSON.stringify(rawRes.data)

    if (rawText.length > 1000000) {
      rawText = rawText.substring(0, 1000000) + '\n\n[日志过长，已截断...]'
    }

    originalLogText.value = rawText
    logContent.value = parseLog(rawText)

    if (log.value?.title) {
      setPageTitle('log', { title: log.value.title, id })
    } else {
      setPageTitle('log', { id })
    }
  } catch (e: any) {
    console.error('Failed to load log:', e)
    error.value = e.response?.data?.error || t('log_not_found')
  } finally {
    loading.value = false
  }
})

const toggleErrors = () => {
  showErrorsOnly.value = !showErrorsOnly.value
}

const deleteLog = async () => {
  if (!confirm(t('delete_log_confirm'))) return

  try {
    const response = await apiClient.delete(`/1/delete/${id}`)
    if (response.data.success) {
      alert(t('delete_log_success'))
      window.location.href = '/'
    } else {
      alert(t('delete_log_failed') + ': ' + (response.data.error || t('unknown_error')))
    }
  } catch (e: any) {
    console.error('Failed to delete log:', e)
    const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message || t('network_error')
    alert(t('delete_log_failed') + ': ' + errorMsg)
  }
}

const copyShareMessage = async () => {
  if (!log.value || !log.value.analysis) {
    try {
      const insightsRes = await apiClient.get(`/1/insights/${id}`)
      log.value = insightsRes.data
    } catch (e) {
      console.error('Failed to load analysis for share message:', e)
    }
  }

  let shareMessage = '我遇到了一个问题，'
  if (log.value && log.value.title) {
    shareMessage += `是${log.value.title} `
  }
  shareMessage += '，网站要求我复制链接给可以帮助我的人，链接如下：\n'
  shareMessage += window.location.href
  shareMessage += '\n不管能不能解决问题，先谢谢大佬！'

  try {
    await navigator.clipboard.writeText(shareMessage)
    isCopySuccess.value = true
    setTimeout(() => isCopySuccess.value = false, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
    const textArea = document.createElement('textarea')
    textArea.value = shareMessage
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    isCopySuccess.value = true
    setTimeout(() => isCopySuccess.value = false, 2000)
  }
}

const downloadLog = async () => {
  try {
    const response = await apiClient.get(`/1/raw/${id}`, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${id}.log`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Failed to download log:', e)
    alert('下载日志失败')
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.classList.add('fullscreen-log-view')
  } else {
    document.body.classList.remove('fullscreen-log-view')
  }
}

const originalLogText = ref('')

const performSearch = () => {
  if (!searchTerm.value.trim()) {
    logContent.value = parseLog(originalLogText.value)
    searchResults.value = []
    searchIndex.value = 0
    return
  }

  const lines = originalLogText.value.split('\n')
  const results: number[] = []
  const matchingLines: string[] = []

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase()
    const searchTerms = searchTerm.value.toLowerCase().split(/\s+/).filter(t => t.length > 0)

    if (searchTerms.length > 0 && searchTerms.every(term => lowerLine.includes(term))) {
      results.push(index)

      let highlightedLine = line
      const sortedTerms = [...searchTerms].sort((a, b) => b.length - a.length)

      sortedTerms.forEach(term => {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escapedTerm})`, 'gi')
        highlightedLine = highlightedLine.replace(regex, '<mark>$1</mark>')
      })

      matchingLines.push(highlightedLine)
    }
  })

  if (matchingLines.length > 0) {
    logContent.value = parseLog(matchingLines.join('\n'))
  } else {
    logContent.value = `<div class="text-center p-8 text-muted-foreground">${t('no_results')}</div>`
  }

  searchResults.value = results
  searchIndex.value = 0

  if (results.length === 0) {
    alert(t('no_results'))
  }
}

const scrollToSearchResult = (_index: number) => {
  const element = document.querySelector('.log-content')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const goToNextResult = () => {
  if (searchResults.value.length === 0) return
  searchIndex.value = (searchIndex.value + 1) % searchResults.value.length
  scrollToSearchResult(searchResults.value[searchIndex.value]!)
}

const goToPrevResult = () => {
  if (searchResults.value.length === 0) return
  const len = searchResults.value.length
  searchIndex.value = (searchIndex.value - 1 + len) % searchResults.value.length
  scrollToSearchResult(searchResults.value[searchIndex.value]!)
}

const handleSearchInput = (event: KeyboardEvent) => {
  if (event.key === 'Enter') performSearch()
}

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const problemsSection = ref<HTMLElement | null>(null)

const scrollToProblems = () => {
  if (problemsSection.value) {
    problemsSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div v-if="loading" class="container mx-auto px-4 py-12 text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    <p class="mt-4 text-muted-foreground">正在加载日志...</p>
  </div>

  <div v-else-if="error" class="container mx-auto px-4 py-12 text-center">
    <h2 class="text-2xl font-bold text-destructive">错误</h2>
    <p class="text-muted-foreground">{{ error }}</p>
  </div>

  <div v-else :class="isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-full'">
    <div :class="isFullscreen ? 'h-full flex flex-col' : 'flex flex-col'">
      <!-- 标题栏 -->
      <div v-if="!isFullscreen" class="flex items-start justify-between gap-4 px-4 py-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold break-all">{{ log.title }}</h1>
          <p class="text-sm text-muted-foreground mt-1">ID: <code class="bg-muted px-2 py-0.5 rounded text-xs">{{ log.id }}</code></p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="toggleFullscreen"
            class="p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            :title="isFullscreen ? t('exit_fullscreen') : t('fullscreen')"
          >
            <Maximize2 class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- 信息卡片区域 -->
      <div v-if="!isFullscreen" class="grid gap-4 md:grid-cols-2 px-4">
        <!-- Server Info -->
        <div v-if="log.analysis?.information?.length > 0" class="bg-card p-4">
          <div class="flex items-center gap-2 mb-3 pb-3 border-b">
            <BookText class="h-5 w-5 text-primary" />
            <h2 class="font-semibold">{{ t('server_info') }}</h2>
          </div>
          <div class="space-y-2">
            <div
              v-for="info in log.analysis.information"
              :key="info.label"
              class="flex items-start justify-between gap-3 py-1.5"
            >
              <span class="text-sm text-muted-foreground font-mono">{{ info.label }}</span>
              <span class="text-sm font-medium text-right break-all max-w-[60%]">{{ info.value }}</span>
            </div>
          </div>
        </div>

        <!-- 问题统计 -->
        <div v-if="log.analysis?.problems?.length > 0" class="bg-card p-4">
          <div class="flex items-center gap-2 mb-3 pb-3 border-b">
            <AlertTriangle class="h-5 w-5 text-destructive" />
            <h2 class="font-semibold">{{ t('problems_detected') }}</h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle class="h-4 w-4 text-destructive" />
              <span class="text-sm font-medium">{{ log.analysis.problems.length }} 个问题</span>
            </div>
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle class="h-4 w-4 text-warning" />
              <span class="text-sm font-medium">{{ log.analysis.problems.filter((p: any) => p.severity === 'warning').length }} 警告</span>
            </div>
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Check class="h-4 w-4 text-green-500" />
              <span class="text-sm font-medium">{{ log.analysis.problems.filter((p: any) => p.solutions?.length).length }} 可解决</span>
            </div>
          </div>
          <button
            @click="scrollToProblems"
            class="w-full mt-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            查看详情 ↓
          </button>
        </div>

        <!-- 无信息时显示占位 -->
        <div v-if="!log.analysis?.information?.length && !log.analysis?.problems?.length" class="bg-card p-8 text-center">
          <BookText class="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p class="text-muted-foreground">暂无服务器信息</p>
        </div>
      </div>

      <!-- 日志查看器 -->
      <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''">
        <!-- 工具栏 -->
        <div class="flex flex-wrap items-center gap-2 p-3 bg-muted/30">
          <!-- 视图控制组 -->
          <div class="flex items-center gap-1.5 pr-3 border-r">
            <button
              @click="toggleErrors"
              :class="showErrorsOnly ? 'bg-destructive text-destructive-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'"
              class="flex items-center gap-1.5 text-sm rounded-md transition-colors px-2.5 py-1.5"
              :title="showErrorsOnly ? '显示全部日志' : '仅显示错误'"
            >
              <AlertTriangle class="h-4 w-4" />
              <span class="hidden sm:inline">{{ showErrorsOnly ? '显示全部' : '仅错误' }}</span>
            </button>
            <button
              @click="wrapLines = !wrapLines"
              :class="wrapLines ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'"
              class="flex items-center gap-1.5 text-sm rounded-md transition-colors px-2.5 py-1.5"
              :title="wrapLines ? '关闭换行' : '开启换行'"
            >
              <WrapText class="h-4 w-4" />
              <span class="hidden sm:inline">{{ wrapLines ? '换行' : '不换行' }}</span>
            </button>
          </div>

          <!-- 搜索组 -->
          <div class="flex items-center gap-1.5 px-3 border-l border-r flex-1 min-w-[200px]">
            <div class="relative flex-1">
              <Search class="h-3.5 w-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                v-model="searchTerm"
                @keyup="handleSearchInput"
                :placeholder="t('search') + '...'"
                class="w-full bg-background border border-border rounded-md pl-7 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div v-if="searchResults.length > 0" class="flex items-center gap-1">
              <span class="text-xs text-muted-foreground">{{ searchIndex + 1 }}/{{ searchResults.length }}</span>
              <button
                @click="goToPrevResult"
                class="p-1.5 rounded-md hover:bg-secondary transition-colors"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button
                @click="goToNextResult"
                class="p-1.5 rounded-md hover:bg-secondary transition-colors"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- 操作组 -->
          <div class="flex items-center gap-1.5 pl-3 border-l ml-auto">
            <button
              @click="downloadLog"
              class="p-2 rounded-md hover:bg-secondary transition-colors"
              :title="t('download')"
            >
              <Download class="h-4 w-4" />
            </button>
            <button
              @click="copyShareMessage"
              :class="isCopySuccess ? 'bg-green-500 text-white' : 'hover:bg-secondary'"
              class="p-2 rounded-md transition-colors"
              :title="t('share')"
            >
              <Share2 class="h-4 w-4" />
            </button>
            <a
              :href="`https://api.logshare.cn/1/raw/${id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 rounded-md hover:bg-secondary transition-colors"
              :title="'查看原始日志'"
            >
              <Code class="h-4 w-4" />
            </a>
            <button
              @click="deleteLog"
              class="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
              :title="t('delete')"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- 日志内容 -->
        <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''">
          <div :class="isFullscreen ? 'flex-1 overflow-y-auto' : 'overflow-x-auto'" class="bg-[#2a2a2a] py-2">
            <div
              class="log-content font-mono text-xs text-gray-100"
              :class="{ 'show-errors-only': showErrorsOnly, 'log-wrap': wrapLines, 'log-no-wrap': !wrapLines }"
              v-html="logContent"
            ></div>
            <button
              @click="scrollToTop"
              class="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs bg-[#3d3d3d] hover:bg-[#4a4a4a] text-gray-100 px-4 py-2 rounded-md transition-colors shadow-lg"
            >
              <ArrowUp class="h-3.5 w-3.5" />
              {{ t('scroll_top') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 问题详情 -->
      <div
        v-if="log.analysis?.problems?.length > 0"
        ref="problemsSection"
        class="bg-card p-4"
      >
        <div class="flex items-center gap-2 mb-4 pb-3 border-b">
          <AlertTriangle class="h-5 w-5 text-destructive" />
          <h2 class="font-semibold">问题详情</h2>
        </div>
        <div class="space-y-3">
          <div
            v-for="(prob, idx) in log.analysis.problems"
            :key="idx"
            class="p-3 rounded-lg border bg-destructive/5 border-destructive/20"
          >
            <div class="flex items-start gap-2">
              <AlertTriangle class="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">{{ prob.message }}</p>
                <p v-if="prob.line" class="text-xs text-muted-foreground mt-1">行号：{{ prob.line }}</p>
                <div v-if="prob.solutions?.length" class="mt-3 space-y-2">
                  <p class="text-xs font-medium text-green-600">解决方案：</p>
                  <div
                    v-for="sol in prob.solutions"
                    :key="sol.message"
                    class="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{{ sol.message }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<style>
.log-content table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.log-content .line-num {
  vertical-align: top;
  text-align: right;
  width: 45px;
  font-size: inherit;
  color: #6b7280;
  line-height: inherit;
  padding-right: 8px;
  border-right: 1px solid #3d3d3d;
  margin-right: 8px;
  user-select: none;
}

.log-content .line-content {
  padding: 0;
  margin: 0;
  word-break: break-all;
  vertical-align: top;
}

.log-content.show-errors-only .entry-no-error {
  display: none;
}

.log-no-wrap .log-content {
  white-space: pre;
  overflow-x: auto;
}

.log-no-wrap .log-content table {
  width: auto;
}

.log-no-wrap .level {
  white-space: pre !important;
}

/* 连续错误/警告行背景 - 使用统一背景 */
.log-content tr.bg-error-group {
  background-color: rgba(239, 68, 68, 0.12) !important;
}

.log-content tr.bg-warning-group {
  background-color: rgba(245, 158, 11, 0.12) !important;
}

.dark .log-content tr.bg-error-group {
  background-color: rgba(239, 68, 68, 0.18) !important;
}

.dark .log-content tr.bg-warning-group {
  background-color: rgba(245, 158, 11, 0.18) !important;
}

mark {
  padding: 0.1em 0.2em;
  margin: 0;
  background-color: #3b82f6;
  color: #ffffff;
  border-radius: 2px;
  font-weight: 500;
}

.dark mark {
  background-color: #60a5fa;
  color: #000000;
}

.log-wrap {
  white-space: normal;
}

.log-no-wrap {
  white-space: pre;
}

.fullscreen-log-view {
  overflow: hidden;
}

.log-content {
  transition: background-color 0.3s ease, color 0.3s ease;
  font-family: 'Fira Code', 'Cascadia Code', 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.3;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  letter-spacing: 0.02em;
}

.log-content p {
  line-height: inherit;
  margin: 0;
}

/* 移动端优化 - 更紧凑 */
@media (max-width: 767px) {
  .log-content {
    font-size: 13px;
    line-height: 1.25;
  }

  .log-content .line-num {
    width: 35px;
    font-size: 12px;
    padding-right: 6px;
    margin-right: 6px;
  }
}

/* PC 端优化 - 更大字体，更紧凑行高 */
@media (min-width: 1024px) {
  .log-content {
    font-size: 15px;
    line-height: 1.2;
  }

  .log-content .line-num {
    font-size: inherit;
    width: 50px;
    padding-right: 10px;
    margin-right: 10px;
  }
}
</style>
