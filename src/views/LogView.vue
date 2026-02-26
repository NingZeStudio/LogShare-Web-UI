<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/lib/api'
import { parseLog } from '@/lib/logParser'
import MarkdownIt from 'markdown-it'
import { saveAIAnalysisRecord } from '@/lib/localStorage'
import { setPageTitle } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'
import {
  WrapText,
  ArrowDownToLine,
  Brain,
  History,
  Sparkles,
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
  Info,
  Server,
  ArrowUp
} from 'lucide-vue-next'

const md = new MarkdownIt({ html: false, linkify: true })

const route = useRoute()
const id = route.params.id as string
const log = ref<any>(null)
const logContent = ref('')
const loading = ref(true)
const error = ref('')
const showErrorsOnly = ref(false)
const wrapLines = ref(false)
const analyzing = ref(false)
const aiResult = ref('')
const searchTerm = ref('')
const searchIndex = ref(0)
const searchResults = ref<number[]>([])
const isFullscreen = ref(false)
const isCopySuccess = ref(false)
let cachedAllRecords: any[] | null = null

const showHistory = ref(false)
const aiAnalysisHistory = ref<any[]>([])

const formattedAiResult = computed(() => {
  if (!aiResult.value) return ''
  if (aiResult.value.startsWith('Error') || aiResult.value.startsWith('Analysis failed')) {
    return `<div class="text-destructive">${aiResult.value}</div>`
  }
  if (aiResult.value.length > 50000) {
    return `<div class="text-destructive">分析结果过长，已截断。请直接查看原始日志。</div>`
  }
  try {
    return md.render(aiResult.value)
  } catch (e) {
    console.error('Markdown 渲染失败:', e)
    return `<div class="text-destructive">渲染分析结果时发生错误：${(e as Error).message}</div>`
  }
})

const analyzeLog = async () => {
  analyzing.value = true
  aiResult.value = ''
  try {
    const { data } = await apiClient.get(`/1/ai-analysis/${id}`)
    if (data.success) {
      aiResult.value = data.analysis
      saveAIAnalysisRecord(id, data.analysis)
      cachedAllRecords = null
    } else {
      aiResult.value = t('analysis_failed') + ': ' + (data.analysis || t('unknown_error'))
    }
  } catch (e: any) {
    console.error(e)
    const msg = e.response?.data?.analysis || e.response?.data?.error || e.message || t('unknown_error')
    aiResult.value = t('analysis_failed') + ': ' + msg
  } finally {
    analyzing.value = false
  }
}

const loadAIAnalysisHistory = () => {
  if (cachedAllRecords === null) {
    try {
      cachedAllRecords = JSON.parse(localStorage.getItem('ai_analysis_history') || '[]')
    } catch (e) {
      console.error('解析 AI 分析历史记录失败:', e)
      cachedAllRecords = []
    }
  }
  aiAnalysisHistory.value = cachedAllRecords ? cachedAllRecords.filter((r: any) => r.logId === id) : []
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
  if (showHistory.value) {
    loadAIAnalysisHistory()
  }
}

const useHistoricalAnalysis = (analysis: string) => {
  aiResult.value = analysis
  showHistory.value = false
}

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

  <div v-else :class="isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'container mx-auto px-4 py-6'">
    <div :class="isFullscreen ? 'h-full flex flex-col' : 'flex flex-col lg:flex-row gap-6'">
      <div v-if="!isFullscreen" class="w-full lg:w-80 flex-shrink-0 space-y-4">
        <div class="rounded-lg border bg-card p-4 shadow-sm">
          <h1 class="text-base font-bold break-all mb-1">{{ log.title }}</h1>
          <p class="text-xs text-muted-foreground mb-4">ID: {{ log.id }}</p>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="downloadLog"
              class="inline-flex items-center justify-center gap-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-md transition-colors"
            >
              <Download class="h-4 w-4" />
              {{ t('download') }}
            </button>
            <button
              @click="toggleErrors"
              :class="showErrorsOnly ? 'bg-destructive text-destructive-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'"
              class="inline-flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-md transition-colors"
            >
              <AlertTriangle class="h-4 w-4" />
              {{ showErrorsOnly ? t('show_all') : t('show_errors_only') }}
            </button>
            <button
              @click="deleteLog"
              class="inline-flex items-center justify-center gap-1.5 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-md transition-colors"
            >
              <Trash2 class="h-4 w-4" />
              {{ t('delete') }}
            </button>
            <button
              @click="copyShareMessage"
              :class="isCopySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'"
              class="inline-flex items-center justify-center gap-1.5 text-sm text-primary-foreground px-3 py-2 rounded-md transition-colors"
            >
              <Share2 class="h-4 w-4" />
              {{ isCopySuccess ? t('copied') : t('share') }}
            </button>
          </div>

          <button
            @click="toggleFullscreen"
            class="w-full mt-2 inline-flex items-center justify-center gap-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-md transition-colors"
          >
            <Maximize2 class="h-4 w-4" />
            {{ isFullscreen ? t('exit_fullscreen') : t('fullscreen') }}
          </button>

          <div class="flex items-center justify-between mt-4 pt-3 border-t">
            <div class="flex items-center gap-2">
              <WrapText class="h-4 w-4 text-muted-foreground" />
              <label class="text-sm text-muted-foreground cursor-select-none">{{ t('auto_wrap') }}</label>
              <button
                @click="wrapLines = !wrapLines"
                :class="wrapLines ? 'bg-primary' : 'bg-muted'"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              >
                <span
                  :class="wrapLines ? 'translate-x-4' : 'translate-x-0.5'"
                  class="inline-block h-4 w-4 transform rounded-full bg-background transition-transform"
                />
              </button>
            </div>
            <button
              @click="scrollToFooter"
              class="inline-flex items-center gap-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownToLine class="h-3.5 w-3.5" />
              {{ t('scroll_footer') }}
            </button>
          </div>
        </div>

        <div v-if="log.analysis?.problems?.length > 0" class="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <h3 class="font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle class="h-4 w-4" />
            {{ t('problems_detected') }}
          </h3>
          <div class="space-y-3">
            <div
              v-for="(prob, idx) in log.analysis.problems"
              :key="idx"
              class="text-sm p-3 rounded-md border border-destructive/20 bg-destructive/5"
            >
              <div class="font-medium flex items-start gap-2">
                <AlertTriangle class="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>{{ prob.message }}</span>
                <span v-if="prob.line" class="text-xs text-muted-foreground">(行 {{ prob.line }})</span>
              </div>
              <div v-if="prob.solutions?.length" class="mt-2 pl-5 border-l-2 border-destructive/30 space-y-1">
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

        <div class="rounded-lg border bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-primary/30 p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold flex items-center gap-2">
              <Brain class="h-4 w-4 text-primary" />
              {{ t('ai_analysis') }}
            </h3>
            <button
              @click="toggleHistory"
              class="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1"
            >
              <History class="h-3 w-3" />
              历史
            </button>
          </div>

          <div v-if="showHistory" class="mb-3 p-3 rounded-md border bg-secondary/30">
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-medium text-xs">历史分析记录</h4>
              <button @click="showHistory = false" class="text-xs text-muted-foreground hover:text-foreground">
                <X class="h-3 w-3" />
              </button>
            </div>
            <div v-if="aiAnalysisHistory.length === 0" class="text-xs text-muted-foreground italic py-2">
              暂无历史记录
            </div>
            <div v-else class="space-y-1.5 max-h-32 overflow-y-auto">
              <div
                v-for="(record, index) in aiAnalysisHistory"
                :key="index"
                class="p-2 rounded-md border bg-background text-xs cursor-pointer hover:bg-secondary/50 transition-colors"
                @click="useHistoricalAnalysis(record.analysis)"
              >
                {{ new Date(record.timestamp).toLocaleString() }}
              </div>
            </div>
          </div>

          <div v-if="!aiResult && !analyzing">
            <button
              @click="analyzeLog"
              class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-md font-medium shadow transition-all inline-flex items-center justify-center gap-2"
            >
              <Sparkles class="h-4 w-4" />
              {{ t('start_analysis') }}
            </button>
            <p class="text-xs text-muted-foreground mt-2 text-center">{{ t('analysis_disclaimer') }}</p>
          </div>
          <div v-else-if="analyzing" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p class="text-sm text-muted-foreground mt-2">{{ t('analysis_loading') }}</p>
          </div>
          <div
            v-else
            class="text-sm bg-secondary/50 rounded-md border p-3 overflow-x-auto max-h-64 overflow-y-auto"
          >
            <div class="prose prose-sm dark:prose-invert max-w-none break-words" v-html="formattedAiResult"></div>
          </div>
        </div>

        <div v-if="log.analysis?.information?.length > 0" class="rounded-lg border bg-card p-4">
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <Server class="h-4 w-4" />
            {{ t('server_info') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="info in log.analysis.information"
              :key="info.label"
              class="flex justify-between text-sm py-2 border-b last:border-0"
            >
              <span class="text-muted-foreground">{{ info.label }}</span>
              <span class="font-medium text-right break-all max-w-[50%]">{{ info.value }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
          <Info class="h-3.5 w-3.5 inline mr-1" />
          {{ t('tips') }}
        </div>
      </div>

      <div :class="isFullscreen ? 'flex-1' : 'w-full lg:flex-1 lg:max-w-none'">
        <div class="rounded-t-lg bg-[#2d2d2d] px-4 py-2.5 flex items-center justify-between border-b border-gray-600">
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

        <div :class="isFullscreen ? 'flex-1 flex flex-col' : ''">
          <div :class="isFullscreen ? 'flex-1 overflow-auto' : 'overflow-x-auto'" class="bg-[#0f0f0f] border border-gray-600 rounded-b-lg">
            <div
              class="log-content font-mono text-xs p-4 text-gray-100"
              :class="{ 'show-errors-only': showErrorsOnly, 'log-wrap': wrapLines, 'log-no-wrap': !wrapLines }"
              v-html="logContent"
            ></div>
          </div>
          <div class="flex justify-end p-2 border-t border-gray-600 bg-[#1a1a1a]">
            <button
              @click="scrollToTop"
              class="inline-flex items-center gap-1.5 text-xs bg-[#2d2d2d] hover:bg-[#3a3a3a] text-gray-100 px-3 py-1.5 rounded-md transition-colors"
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
}

.log-content .line-number-container {
  width: 1%;
  white-space: nowrap;
}

.log-content.show-errors-only .entry-no-error {
  display: none;
}

.log-no-wrap .log-content {
  white-space: pre;
}

.log-no-wrap .level {
  white-space: pre !important;
}

.log-content .entry[data-level="error"],
.log-content .entry[data-level="critical"],
.log-content .entry[data-level="emergency"] {
  background-color: rgba(239, 68, 68, 0.2) !important;
}

.log-content .entry[data-level="warning"] {
  background-color: rgba(245, 158, 11, 0.2) !important;
}

.dark .log-content .entry[data-level="error"],
.dark .log-content .entry[data-level="critical"],
.dark .log-content .entry[data-level="emergency"] {
  background-color: rgba(239, 68, 68, 0.3) !important;
}

.dark .log-content .entry[data-level="warning"] {
  background-color: rgba(245, 158, 11, 0.3) !important;
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
}
</style>
