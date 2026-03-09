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

// 扩展 HTMLElement 类型以支持 _clickOutside 属性
declare global {
  interface HTMLElement {
    _clickOutside?: (event: MouseEvent) => void
  }
}

// v-click-outside 指令
const vClickOutside = {
  mounted: (el: HTMLElement, binding: any) => {
    el._clickOutside = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted: (el: HTMLElement) => {
    if (el._clickOutside) {
      document.removeEventListener('click', el._clickOutside)
    }
  }
}

const route = useRoute()
const id = route.params.id as string
const log = ref<any>(null)
const logContent = ref('')
const loading = ref(true)
const error = ref('')
const showErrorsOnly = ref(false)
const wrapLines = ref(false)
const searchTerm = ref('')
const searchIndex = ref(0)
const searchResults = ref<number[]>([])
const isFullscreen = ref(false)
const isCopySuccess = ref(false)
const showActionsMenu = ref(false)

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
    alert(t('download_failed'))
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
    <p class="mt-4 text-muted-foreground">{{ t('loading_log') }}</p>
  </div>

  <div v-else-if="error" class="container mx-auto px-4 py-12 text-center">
    <h2 class="text-2xl font-bold text-destructive">{{ t('error_title') }}</h2>
    <p class="text-muted-foreground">{{ error }}</p>
  </div>

  <div v-else :class="isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-full'">
    <div :class="isFullscreen ? 'h-full flex flex-col' : 'flex flex-col'">
      <!-- 标题栏 -->
      <div v-if="!isFullscreen" class="flex items-start justify-between gap-4 px-4 py-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold break-all">{{ log.title }}</h1>
          <p class="text-sm text-muted-foreground mt-1">{{ t('log_type') }}: <code class="bg-muted px-2 py-0.5 rounded text-xs">{{ log.id }}</code></p>
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
              <span class="text-sm font-medium">{{ t('problems_count').replace('{count}', log.analysis.problems.length.toString()) }}</span>
            </div>
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle class="h-4 w-4 text-warning" />
              <span class="text-sm font-medium">{{ t('warnings_count').replace('{count}', log.analysis.problems.filter((p: any) => p.severity === 'warning').length.toString()) }}</span>
            </div>
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Check class="h-4 w-4 text-green-500" />
              <span class="text-sm font-medium">{{ t('solvable_count').replace('{count}', log.analysis.problems.filter((p: any) => p.solutions?.length).length.toString()) }}</span>
            </div>
          </div>
          <button
            @click="scrollToProblems"
            class="w-full mt-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            {{ t('view_details') }} ↓
          </button>
        </div>

      </div>

      <!-- 日志查看器 -->
      <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''">
        <!-- 工具栏 -->
        <div class="border-b bg-muted/30">
          <!-- 主工具栏 -->
          <div class="flex items-center gap-2 p-2">
            <!-- 视图控制 -->
            <div class="flex items-center gap-1">
              <button
                @click="toggleErrors"
                :class="showErrorsOnly ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-secondary/80 hover:bg-secondary text-secondary-foreground'"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-3 py-1.5 font-medium"
                :title="showErrorsOnly ? t('show_all') : t('show_errors_only')"
              >
                <AlertTriangle class="h-4 w-4" />
                <span class="hidden sm:inline">{{ showErrorsOnly ? t('show_all') : t('show_errors_only') }}</span>
              </button>
              <button
                @click="wrapLines = !wrapLines"
                :class="wrapLines ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary/80 hover:bg-secondary text-secondary-foreground'"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-3 py-1.5 font-medium"
                :title="t('toggle_wrap')"
              >
                <WrapText class="h-4 w-4" />
                <span class="hidden sm:inline">{{ wrapLines ? t('wrap_lines_on') : t('wrap_lines_off') }}</span>
              </button>
            </div>

            <!-- 搜索框 -->
            <div class="flex-1 min-w-0">
              <div class="relative">
                <Search class="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="searchTerm"
                  @keyup="handleSearchInput"
                  :placeholder="t('search') + ' (Ctrl+F)'"
                  class="w-full bg-background border border-border rounded-md pl-9 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            <!-- 搜索结果导航 -->
            <div v-if="searchResults.length > 0" class="hidden sm:flex items-center gap-1">
              <span class="text-xs text-muted-foreground font-mono min-w-[60px] text-center">{{ searchIndex + 1 }}/{{ searchResults.length }}</span>
              <button
                @click="goToPrevResult"
                class="p-1.5 rounded-md hover:bg-secondary transition-colors"
                :title="t('previous_result')"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button
                @click="goToNextResult"
                class="p-1.5 rounded-md hover:bg-secondary transition-colors"
                :title="t('next_result')"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>

            <!-- 主要操作 -->
            <div class="flex items-center gap-1">
              <span class="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground pr-2 mr-1 border-r">
                {{ t('click_share_button_tip').split('{icon}')[0] }}<Share2 class="h-3.5 w-3.5" />{{ t('click_share_button_tip').split('{icon}')[1] }}
              </span>
              <button
                @click="copyShareMessage"
                :class="isCopySuccess ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-primary text-primary-foreground hover:bg-primary/90'"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-3 py-1.5 font-medium"
                :title="t('share')"
              >
                <Share2 class="h-4 w-4" />
                <span class="hidden sm:inline">{{ isCopySuccess ? t('copied') : t('share') }}</span>
              </button>
            </div>

            <!-- 更多操作下拉菜单 -->
            <div class="relative">
              <button
                @click.stop="showActionsMenu = !showActionsMenu"
                class="p-2 rounded-md hover:bg-secondary transition-colors"
                :title="t('more_actions')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>

              <!-- 下拉菜单 -->
              <div
                v-if="showActionsMenu"
                class="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                v-click-outside="() => showActionsMenu = false"
              >
                <button
                  @click="downloadLog; showActionsMenu = false"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Download class="h-4 w-4" />
                  {{ t('download') }}
                </button>
                <a
                  :href="`https://api.logshare.cn/1/raw/${id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Code class="h-4 w-4" />
                  {{ t('view_raw_log') }}
                </a>
                <button
                  @click="deleteLog; showActionsMenu = false"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                >
                  <Trash2 class="h-4 w-4" />
                  {{ t('delete') }}
                </button>
              </div>
            </div>
          </div>

          <!-- 移动端搜索导航 -->
          <div v-if="searchResults.length > 0" class="sm:hidden flex items-center justify-between px-2 pb-2">
            <span class="text-xs text-muted-foreground font-mono">{{ searchIndex + 1 }}/{{ searchResults.length }}</span>
            <div class="flex items-center gap-1">
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
        </div>

        <!-- 日志内容 -->
        <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''">
          <div :class="isFullscreen ? 'flex-1 overflow-y-auto' : 'overflow-x-auto relative'" class="bg-[#2a2a2a] py-2">
            <div
              class="log-content font-mono text-xs text-gray-100"
              :class="{ 'show-errors-only': showErrorsOnly, 'log-wrap': wrapLines, 'log-no-wrap': !wrapLines }"
              v-html="logContent"
            ></div>
            <button
              @click="scrollToTop"
              class="fixed bottom-4 right-4 inline-flex items-center gap-1.5 text-xs bg-[#3d3d3d] hover:bg-[#4a4a4a] text-gray-100 px-4 py-2 rounded-md transition-colors shadow-lg"
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
          <h2 class="font-semibold">{{ t('problem_details') }}</h2>
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
                <p v-if="prob.line" class="text-xs text-muted-foreground mt-1">{{ t('line_number') }}: {{ prob.line }}</p>
                <div v-if="prob.solutions?.length" class="mt-3 space-y-2">
                  <p class="text-xs font-medium text-green-600">{{ t('solution') }}:</p>
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
  font-family: var(--font-mono);
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
