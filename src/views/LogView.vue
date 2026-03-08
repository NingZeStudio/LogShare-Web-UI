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
  ArrowDownToLine,
  Search,
  Download,
  Trash2,
  Share2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  ArrowUp,
  Code
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

const scrollToFooter = () => {
  const footer = document.querySelector('footer')
  if (footer) {
    footer.scrollIntoView({ behavior: 'smooth' })
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
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

  <div v-else :class="isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'container mx-auto px-1 sm:px-2 py-4'">
    <div :class="isFullscreen ? 'h-full flex flex-col' : 'flex flex-col'">
      <div v-if="!isFullscreen" class="space-y-0">
        <div class="bg-card px-3 py-2">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div class="min-w-0 flex-1">
              <h1 class="text-lg font-bold break-all">{{ log.title }}</h1>
              <p class="text-xs text-muted-foreground">ID: {{ log.id }}</p>
            </div>
            <button
              @click="toggleFullscreen"
              class="flex-shrink-0 p-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors w-fit"
              :title="isFullscreen ? t('exit_fullscreen') : t('fullscreen')"
            >
              <Maximize2 class="h-4 w-4" />
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2 mb-3">
            <button
              @click="downloadLog"
              class="flex items-center justify-center gap-1.5 text-sm whitespace-nowrap bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors px-3 py-2"
            >
              <Download class="h-4 w-4 flex-shrink-0" />
              <span>下载</span>
            </button>
            <button
              @click="toggleErrors"
              :class="showErrorsOnly ? 'bg-destructive text-destructive-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'"
              class="flex items-center justify-center gap-1.5 text-sm whitespace-nowrap rounded-md transition-colors px-3 py-2"
            >
              <AlertTriangle class="h-4 w-4 flex-shrink-0" />
              <span>{{ showErrorsOnly ? '显示全部' : '仅错误' }}</span>
            </button>
            <button
              @click="copyShareMessage"
              :class="isCopySuccess ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90 text-background'"
              class="flex items-center justify-center gap-1.5 text-sm whitespace-nowrap rounded-md transition-colors px-3 py-2"
            >
              <Share2 class="h-4 w-4 flex-shrink-0" />
              <span>{{ isCopySuccess ? '已复制' : '分享' }}</span>
            </button>
            <button
              @click="deleteLog"
              class="flex items-center justify-center gap-1.5 text-sm whitespace-nowrap bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md transition-colors px-3 py-2"
            >
              <Trash2 class="h-4 w-4 flex-shrink-0" />
              <span>删除</span>
            </button>
            <button
              @click="wrapLines = !wrapLines"
              :class="wrapLines ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'"
              class="flex items-center gap-1.5 text-sm whitespace-nowrap rounded-md transition-colors px-3 py-2"
            >
              <WrapText class="h-4 w-4" />
              <span>{{ wrapLines ? '换行开启' : '换行关闭' }}</span>
            </button>
            <a
              :href="`https://api.logshare.cn/1/raw/${id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-sm whitespace-nowrap bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors px-3 py-2"
            >
              <Code class="h-4 w-4" />
              <span>原始日志</span>
            </a>
            <button
              @click="scrollToFooter"
              class="flex items-center gap-1.5 text-sm whitespace-nowrap bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors px-3 py-2"
            >
              <ArrowDownToLine class="h-4 w-4" />
              <span>{{ t('scroll_footer') }}</span>
            </button>
          </div>

          <div v-if="log.analysis?.information?.length > 0" class="overflow-x-auto">
            <table class="text-sm border-collapse border border-border">
              <thead class="bg-muted">
                <tr>
                  <th class="border border-border p-2 text-left font-medium text-muted-foreground">{{ t('property') }}</th>
                  <th class="border border-border p-2 text-left font-medium">{{ t('value') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="info in log.analysis.information"
                  :key="info.label"
                >
                  <td class="border border-border p-2 font-mono text-primary">{{ info.label }}</td>
                  <td class="border border-border p-2">{{ info.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="log.analysis?.problems?.length > 0" class="bg-destructive/5 p-4 border border-destructive/50 rounded-lg">
          <h3 class="font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle class="h-4 w-4" />
            {{ t('problems_detected') }}
          </h3>
          <div class="space-y-3">
            <div
              v-for="(prob, idx) in log.analysis.problems"
              :key="idx"
              class="text-sm py-2"
            >
              <div class="font-medium flex items-start gap-2">
                <AlertTriangle class="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>{{ prob.message }}</span>
                <span v-if="prob.line" class="text-xs text-muted-foreground">(行 {{ prob.line }})</span>
              </div>
              <div v-if="prob.solutions?.length" class="mt-2 pl-5 space-y-1">
                <div
                  v-for="sol in prob.solutions"
                  :key="sol.message"
                  class="text-muted-foreground text-sm flex items-start gap-2"
                >
                  <Check class="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{{ sol.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : 'w-full'">
        <div class="bg-[#2a2a2a] px-4 py-2 flex items-center justify-between -mx-1 sm:-mx-2 mt-4">
          <div class="flex items-center gap-2">
            <div class="flex gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <span class="text-sm text-gray-300 ml-2">{{ id }}.log</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative flex items-center">
              <Search class="h-3.5 w-3.5 text-gray-400 absolute left-2 pointer-events-none" />
              <input
                v-model="searchTerm"
                @keyup="handleSearchInput"
                :placeholder="t('search') + '...'"
                class="bg-[#0f0f0f] border border-gray-600 text-sm rounded-md pl-7 pr-2 py-1 w-28 sm:w-36 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              <div v-if="searchResults.length > 0" class="ml-2 text-xs text-gray-400">
                {{ searchIndex + 1 }}/{{ searchResults.length }}
              </div>
              <button
                v-if="searchResults.length > 0"
                @click="goToPrevResult"
                class="ml-1 text-gray-400 hover:text-gray-200"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button
                v-if="searchResults.length > 0"
                @click="goToNextResult"
                class="ml-1 text-gray-400 hover:text-gray-200"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
            <button
              v-if="isFullscreen"
              @click="toggleFullscreen"
              class="text-gray-400 hover:text-gray-200"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''">
          <div :class="[isFullscreen ? 'flex-1 overflow-y-auto' : 'overflow-x-auto']" class="bg-[#2a2a2a] relative -mx-1 sm:-mx-2 py-2">
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
  width: 40px;
  font-size: 13px;
  color: #6b7280;
  line-height: inherit;
}

.log-content .line-content {
  padding: 0;
  margin: 0;
  word-break: break-all;
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
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.log-content p {
  line-height: 1.3;
}
</style>
