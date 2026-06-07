<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiClient, type AiAnalysisResult, type AiError } from '@/lib/ApiClient'
import { parseLog } from '@/lib/logParser'
import { setPageTitle } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'
import '@/assets/LogsAnalysis.css'
import {
  WrapText,
  Search,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  ArrowUp,
  Code,
  BookText,
  Trash2,
  RefreshCw
} from 'lucide-vue-next'

declare global {
  interface HTMLElement {
    _clickOutside?: (event: MouseEvent) => void
  }
}

const route = useRoute()
const router = useRouter()
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
const isDeleting = ref(false)
const logToken = ref<string | null>(null)
const logFontSize = ref(12)
const isEditingFontSize = ref(false)
const fontSizeInput = ref('12')
const fontSizeInputEl = ref<HTMLInputElement | null>(null)
const notifications = ref<{ id: number; type: 'success' | 'error'; message: string }[]>([])
let notificationId = 0

const aiAnalysis = ref<AiAnalysisResult | null>(null)
const aiLoading = ref(false)
const aiError = ref('')
const aiStreamingContent = ref('')
const aiIsStreaming = ref(false)
const aiIsCached = ref(false)
const showAiPanel = ref(false)

const aiIssueCount = computed(() => aiAnalysis.value?.issues?.length || 0)
const aiRecommendationCount = computed(() => aiAnalysis.value?.recommendations?.length || 0)
const aiStreamingLength = computed(() => aiStreamingContent.value.trim().length)
const hasAiContent = computed(() => {
  if (!aiAnalysis.value) return false
  return Boolean(
    aiAnalysis.value.summary ||
      aiAnalysis.value.severity ||
      aiAnalysis.value.issues?.length ||
      aiAnalysis.value.recommendations?.length
  )
})

const mapAiErrorMessage = (error: AiError) => {
  switch (error.type) {
    case 'not_found':
      return t('ai_error_not_found')
    case 'rate_limit':
      return t('ai_error_rate_limit')
    case 'analysis_failed':
    case 'parse_error':
      return t('ai_error_parse')
    case 'server_error':
      return t('ai_error_server')
    default:
      return error.error || t('ai_error_unknown')
  }
}

const loadAiAnalysis = async () => {
  aiLoading.value = true
  aiError.value = ''
  aiStreamingContent.value = ''
  aiIsStreaming.value = false
  aiIsCached.value = false
  aiAnalysis.value = null

  try {
    await apiClient.streamAiAnalysis(id, {
      onChunk: rawJson => {
        aiIsStreaming.value = true
        aiStreamingContent.value = rawJson
        try {
          const parsed = JSON.parse(rawJson)
          if (parsed.summary || parsed.issues || parsed.recommendations) {
            aiAnalysis.value = parsed
          }
        } catch {
          // 解析中，JSON 还不完整
        }
      },
      onDone: (analysis, cached) => {
        aiAnalysis.value = analysis
        aiIsStreaming.value = false
        aiIsCached.value = cached
        aiLoading.value = false
      },
      onError: error => {
        aiError.value = mapAiErrorMessage(error)
        aiIsStreaming.value = false
        aiLoading.value = false
      }
    })
  } catch (e: any) {
    console.error('AI analysis error:', e)
    aiError.value = e.response?.data?.error || t('ai_analysis_failed')
    aiLoading.value = false
    aiIsStreaming.value = false
  }
}

const addNotification = (type: 'success' | 'error', message: string) => {
  const id = ++notificationId
  notifications.value.push({ id, type, message })
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 5000)
}

const removeNotification = (id: number) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

onMounted(() => {
  loadLog()
  logToken.value = localStorage.getItem(`log_token_${id}`)
  const savedFontSize = localStorage.getItem('log_font_size')
  if (savedFontSize) {
    const val = parseInt(savedFontSize)
    if (!isNaN(val) && val >= 8 && val <= 48) logFontSize.value = val
  }
})

const loadLog = async () => {
  try {
    const [rawRes, insightsRes] = await Promise.all([
      apiClient.get(`/1/raw/${id}`),
      apiClient.get(`/1/insights/${id}`)
    ])

    log.value = insightsRes.data
    const rawText = typeof rawRes.data === 'string' ? rawRes.data : JSON.stringify(rawRes.data)

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
}

const toggleErrors = () => {
  showErrorsOnly.value = !showErrorsOnly.value
}

const deleteLog = async () => {
  if (!logToken.value) {
    if (!confirm(`${t('delete_log_confirm_no_token')}\n\n${t('delete_log_confirm')}`)) {
      return
    }
  } else {
    if (!confirm(t('delete_log_confirm'))) {
      return
    }
  }

  isDeleting.value = true
  try {
    if (logToken.value) {
      const result = await apiClient.deleteLog(id, logToken.value)
      if (result.success) {
        // 删除成功后跳转到首页
        localStorage.removeItem(`log_token_${id}`)
        router.push('/')
        addNotification('success', t('delete_log_success'))
      } else {
        addNotification('error', t('delete_log_failed') + ': ' + (result.failed[0]?.message || ''))
      }
    } else {
      // 没有 token 的情况下尝试删除（可能会失败）
      addNotification('error', t('delete_log_no_token'))
    }
  } catch (e: any) {
    console.error('Delete error:', e)
    addNotification('error', e.response?.data?.error || t('delete_log_failed'))
  } finally {
    isDeleting.value = false
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
    setTimeout(() => (isCopySuccess.value = false), 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
    const textArea = document.createElement('textarea')
    textArea.value = shareMessage
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    isCopySuccess.value = true
    setTimeout(() => (isCopySuccess.value = false), 2000)
  }
}

const downloadLog = () => {
  const text = originalLogText.value
  if (!text) {
    alert(t('download_failed'))
    return
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${id}.log`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const enterFullscreen = () => {
  isFullscreen.value = true
  document.body.classList.add('fullscreen-log-view')
}

const exitFullscreen = () => {
  isFullscreen.value = false
  document.body.classList.remove('fullscreen-log-view')
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
    const searchTerms = searchTerm.value
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 0)

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

const increaseFontSize = () => {
  if (logFontSize.value < 24) {
    logFontSize.value += 2
    saveFontSize()
  }
}

const decreaseFontSize = () => {
  if (logFontSize.value > 10) {
    logFontSize.value -= 2
    saveFontSize()
  }
}

const startEditFontSize = async () => {
  fontSizeInput.value = String(logFontSize.value)
  isEditingFontSize.value = true
  await nextTick()
  fontSizeInputEl.value?.focus()
  fontSizeInputEl.value?.select()
}

const applyFontSize = () => {
  const val = parseInt(fontSizeInput.value)
  if (!isNaN(val) && val >= 8 && val <= 48) {
    logFontSize.value = val
    saveFontSize()
  }
  isEditingFontSize.value = false
}

const handleFontSizeKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') applyFontSize()
  if (e.key === 'Escape') isEditingFontSize.value = false
}

const saveFontSize = () => {
  localStorage.setItem('log_font_size', String(logFontSize.value))
}

const problemsSection = ref<HTMLElement | null>(null)

const scrollToProblems = () => {
  if (problemsSection.value) {
    problemsSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const openAiPanel = () => {
  showAiPanel.value = true
  if (!aiAnalysis.value && !aiLoading.value && !aiError.value) {
    loadAiAnalysis()
  }
}

const closeAiPanel = () => {
  showAiPanel.value = false
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

  <div
    v-else
    :class="
      isFullscreen ? 'fixed inset-0 z-50 bg-background transition-all duration-300' : 'w-full'
    "
  >
    <div :class="isFullscreen ? 'h-full flex flex-col' : 'flex flex-col'">
      <!-- 标题栏 -->
      <div v-if="!isFullscreen" class="flex items-start justify-between gap-4 px-4 py-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold break-all">{{ log.title }}</h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{ t('log_type') }}:
            <code class="bg-muted px-2 py-0.5 rounded text-xs">{{ log.id }}</code>
          </p>
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
              <span class="text-sm font-medium text-right break-all max-w-[60%]">{{
                info.value
              }}</span>
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
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertTriangle class="h-4 w-4 text-destructive" />
              <span class="text-sm font-medium">{{
                t('problems_count').replace('{count}', log.analysis.problems.length.toString())
              }}</span>
            </div>
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20"
            >
              <AlertTriangle class="h-4 w-4 text-warning" />
              <span class="text-sm font-medium">{{
                t('warnings_count').replace(
                  '{count}',
                  log.analysis.problems
                    .filter((p: any) => p.severity === 'warning')
                    .length.toString()
                )
              }}</span>
            </div>
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <Check class="h-4 w-4 text-green-500" />
              <span class="text-sm font-medium">{{
                t('solvable_count').replace(
                  '{count}',
                  log.analysis.problems.filter((p: any) => p.solutions?.length).length.toString()
                )
              }}</span>
            </div>
          </div>
          <button
            class="w-full mt-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
            @click="scrollToProblems"
          >
            {{ t('view_details') }} ↓
          </button>
        </div>
      </div>

      <!-- 帮助提示 -->
      <div v-if="!isFullscreen" class="px-4 my-4">
        <div
          class="bg-card border border-border rounded-lg p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex-1">
            <h2 class="text-base font-semibold">{{ t('log_help_card_title') }}</h2>
            <p class="text-sm text-muted-foreground mt-1">
              {{ t('log_help_card_desc') }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              :class="
                isCopySuccess
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              "
              class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors shrink-0"
              @click="copyShareMessage"
            >
              {{ isCopySuccess ? t('copied') : '复制分享' }}
            </button>
            <a
              href="https://qm.qq.com/q/FOGt99aayY"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
            >
              {{ t('join_qq_group_link') }}
            </a>
          </div>
        </div>
      </div>

      <!-- 日志查看器 -->
      <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''">
        <!-- 工具栏 -->
        <div class="border-b bg-muted/30">
          <!-- 主工具栏：功能按钮区 -->
          <div class="flex items-center justify-between gap-2 p-2 border-b border-muted">
            <!-- 左侧：视图控制 -->
            <div class="flex items-center gap-1">
              <button
                :class="
                  showErrorsOnly
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : 'bg-secondary/80 hover:bg-secondary text-secondary-foreground'
                "
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium"
                :title="showErrorsOnly ? t('show_all') : t('show_errors_only')"
                @click="toggleErrors"
              >
                <AlertTriangle class="h-5 w-5" />
                <span class="hidden sm:inline">{{
                  showErrorsOnly ? t('show_all') : t('show_errors_only')
                }}</span>
              </button>
              <button
                :class="
                  wrapLines
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary/80 hover:bg-secondary text-secondary-foreground'
                "
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium"
                :title="t('toggle_wrap')"
                @click="wrapLines = !wrapLines"
              >
                <WrapText class="h-5 w-5" />
                <span class="hidden sm:inline">{{
                  wrapLines ? t('wrap_lines_on') : t('wrap_lines_off')
                }}</span>
              </button>
              <button
                class="log-analysis-trigger hidden sm:inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                @click="openAiPanel"
              >
                LogAnalysis 智能分析
              </button>
            </div>

            <!-- 右侧：操作按钮 -->
            <div class="flex items-center gap-1">
              <button
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                :title="t('download')"
                @click="downloadLog"
              >
                <Download class="h-5 w-5" />
                <span class="hidden sm:inline">{{ t('download') }}</span>
              </button>
              <a
                :href="`https://api.logshare.cn/1/raw/${id}`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                :title="t('view_raw_log')"
              >
                <Code class="h-5 w-5" />
                <span class="hidden sm:inline">{{ t('view_raw_log') }}</span>
              </a>
              <button
                :disabled="isDeleting"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-colors px-4 py-2 font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive disabled:opacity-50"
                :title="t('delete')"
                @click="deleteLog"
              >
                <Trash2 class="h-5 w-5" />
                <span class="hidden sm:inline">{{ isDeleting ? t('deleting') : t('delete') }}</span>
              </button>
              <button
                v-if="!isFullscreen"
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-all duration-300 px-4 py-2 font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                :title="t('fullscreen')"
                @click="enterFullscreen"
              >
                <Maximize2 class="h-5 w-5" />
                <span class="hidden sm:inline">{{ t('fullscreen') }}</span>
              </button>
              <button
                v-else
                class="inline-flex items-center gap-1.5 text-sm rounded-md transition-all duration-300 px-4 py-2 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                :title="t('exit_fullscreen')"
                @click="exitFullscreen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
                <span class="hidden sm:inline">{{ t('exit_fullscreen') }}</span>
              </button>
              <div class="hidden sm:flex items-center gap-0.5 ml-1">
                <button
                  class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                  :class="{ 'opacity-40': logFontSize <= 10 }"
                  :disabled="logFontSize <= 10"
                  @click="decreaseFontSize"
                >−</button>
                <input
                  v-if="isEditingFontSize"
                  ref="fontSizeInputEl"
                  v-model="fontSizeInput"
                  type="number"
                  min="8"
                  max="48"
                  class="w-14 text-center text-sm font-mono bg-background border border-primary rounded px-1 py-0.5 focus:outline-none"
                  @blur="applyFontSize"
                  @keydown="handleFontSizeKeydown"
                />
                <button
                  v-else
                  class="w-10 text-center text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                  @click="startEditFontSize"
                >{{ logFontSize }}</button>
                <button
                  class="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                  :class="{ 'opacity-40': logFontSize >= 24 }"
                  :disabled="logFontSize >= 24"
                  @click="increaseFontSize"
                >+</button>
              </div>
            </div>
          </div>

          <!-- 移动端专用行：字体调节和LogAnalysis按钮 -->
          <div class="flex items-center gap-1 justify-between p-2 border-b border-muted sm:hidden">
            <div class="flex items-center gap-0.5">
              <button
                class="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                :class="{ 'opacity-40': logFontSize <= 10 }"
                :disabled="logFontSize <= 10"
                @click="decreaseFontSize"
              >−</button>
              <input
                v-if="isEditingFontSize"
                v-model="fontSizeInput"
                type="number"
                min="8"
                max="48"
                class="w-12 text-center text-sm font-mono bg-background border border-primary rounded px-1 py-0.5 focus:outline-none"
                @blur="applyFontSize"
                @keydown="handleFontSizeKeydown"
              />
              <button
                v-else
                class="w-8 text-center text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                @click="startEditFontSize"
              >{{ logFontSize }}</button>
              <button
                class="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
                :class="{ 'opacity-40': logFontSize >= 24 }"
                :disabled="logFontSize >= 24"
                @click="increaseFontSize"
              >+</button>
            </div>
            <button
              class="log-analysis-trigger inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              @click="openAiPanel"
            >
              LogAnalysis 智能分析
            </button>
          </div>

          <!-- 搜索栏：搜索框 + 结果导航 -->
          <div class="flex items-center gap-2 p-2">
            <!-- 搜索框 -->
            <div class="flex-1 min-w-0">
              <div class="relative">
                <Search
                  class="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2"
                />
                <input
                  v-model="searchTerm"
                  :placeholder="t('search') + ' (Ctrl+F)'"
                  class="w-full bg-background border border-border rounded-md pl-9 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  @keyup="handleSearchInput"
                />
              </div>
            </div>

            <!-- 搜索结果导航 -->
            <div v-if="searchResults.length > 0" class="flex items-center gap-1">
              <span class="text-xs text-muted-foreground font-mono min-w-[60px] text-center"
                >{{ searchIndex + 1 }}/{{ searchResults.length }}</span
              >
              <button
                class="p-2 rounded-md hover:bg-secondary transition-colors"
                :title="t('previous_result')"
                @click="goToPrevResult"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button
                class="p-2 rounded-md hover:bg-secondary transition-colors"
                :title="t('next_result')"
                @click="goToNextResult"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 日志内容 -->
        <div :class="isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''">
          <div
            :class="isFullscreen ? 'flex-1 overflow-y-auto' : 'overflow-x-auto relative'"
            class="bg-[#2a2a2a] py-2"
          >
            <div
              class="log-content font-mono text-gray-100"
              :style="{ fontSize: logFontSize + 'px' }"
              :class="{
                'show-errors-only': showErrorsOnly,
                'log-wrap': wrapLines,
                'log-no-wrap': !wrapLines
              }"
              v-html="logContent"
            ></div>
            <button
              class="fixed bottom-4 right-4 inline-flex items-center gap-1.5 text-xs bg-[#3d3d3d] hover:bg-[#4a4a4a] text-gray-100 px-4 py-2 rounded-md transition-colors shadow-lg"
              @click="scrollToTop"
            >
              <ArrowUp class="h-3.5 w-3.5" />
              {{ t('scroll_top') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 问题详情 -->
      <div v-if="log.analysis?.problems?.length > 0" ref="problemsSection" class="bg-card p-4">
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
                <p v-if="prob.line" class="text-xs text-muted-foreground mt-1">
                  {{ t('line_number') }}: {{ prob.line }}
                </p>
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

  <!-- AI 分析面板 -->
  <div v-if="showAiPanel" class="fixed inset-0 z-50">
    <!-- 遮罩层 -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      @click="closeAiPanel"
    ></div>

    <!-- 面板 -->
    <div
      class="relative ml-auto h-full w-full md:w-[42rem] lg:w-[48rem] bg-background border-l border-border shadow-2xl flex flex-col"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div class="min-w-0">
          <h2 class="font-semibold flex items-center gap-2">
            {{ t('ai_analysis') }}
            <span v-if="aiIsCached" class="text-xs text-blue-500 font-normal">
              {{ t('ai_cached_result') }}
            </span>
          </h2>
        </div>
        <button
          class="p-2 rounded-md hover:bg-secondary transition-colors"
          @click="closeAiPanel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>



      <div v-if="aiIsStreaming" class="border-b bg-primary/5 px-4 py-3 text-sm">
        <div class="flex items-center gap-2">
          <div class="flex gap-1">
            <div class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
            <div class="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse animation-delay-200"></div>
            <div class="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse animation-delay-400"></div>
          </div>
          <p class="font-medium">{{ t('ai_analyzing_streaming') }}</p>
        </div>
        <p class="mt-1 text-muted-foreground">
          {{ t('ai_streaming_partial').replace('{count}', aiStreamingLength.toString()) }}
        </p>
      </div>

      <!-- 内容区 -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Loading -->
        <div
          v-if="aiLoading && !aiIsStreaming"
          class="flex flex-col items-center justify-center min-h-[300px]"
        >
          <div class="relative w-16 h-16">
            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
            ></div>
            <div
              class="absolute inset-2 rounded-full border-4 border-transparent border-b-primary animate-spin-reverse"
            ></div>
          </div>
          <p class="mt-6 text-sm text-muted-foreground">{{ t('ai_analyzing') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="aiError" class="py-12 text-center">
          <p class="text-sm text-red-500">{{ aiError }}</p>
          <button
            class="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
            @click="loadAiAnalysis"
          >
            <RefreshCw class="h-3.5 w-3.5" />
            {{ t('ai_cached_result') }}
            {{ t('ai_analysis_retry') }}
          </button>
        </div>

        <!-- Result -->
        <div v-else-if="hasAiContent" class="space-y-3">
          <div class="rounded-xl border bg-card p-3">
            <p class="text-sm font-medium mb-1.5">{{ t('ai_analysis_summary') }}</p>
            <p class="text-sm text-muted-foreground">
              {{ aiAnalysis?.summary || t('ai_empty_result') }}
            </p>
          </div>

          <template v-if="aiIssueCount">
            <div class="space-y-3">
              <div
                v-for="(issue, idx) in aiAnalysis?.issues"
                :key="idx"
                class="rounded-lg border border-border/70 bg-background/70 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <p class="text-sm font-semibold text-red-500">{{ issue.type }}</p>
                  <span class="text-xs text-muted-foreground">#{{ idx + 1 }}</span>
                </div>
                <p class="mt-1.5 text-sm text-muted-foreground">{{ issue.description }}</p>
                <div
                  v-if="issue.suggestion"
                  class="mt-2 rounded-md border border-green-500/20 bg-green-500/5 px-3 py-1.5 text-sm text-green-600"
                >
                  <span class="font-medium">{{ t('ai_suggestion') }}:</span>
                  {{ issue.suggestion }}
                </div>
              </div>
            </div>
          </template>

          <div v-if="aiRecommendationCount" class="rounded-xl border bg-card p-3">
            <p class="text-sm font-medium mb-1.5">{{ t('ai_analysis_recommendations') }}</p>
            <ul class="space-y-1">
              <li
                v-for="(rec, idx) in aiAnalysis?.recommendations"
                :key="idx"
                class="rounded-md bg-background/70 px-3 py-1.5 text-sm text-muted-foreground"
              >
                {{ rec }}
              </li>
            </ul>
          </div>

          <div v-if="!aiIssueCount && !aiRecommendationCount" class="rounded-xl border border-dashed p-3">
            <p class="text-sm text-muted-foreground">{{ t('ai_no_issues') }}</p>
          </div>
        </div>

        <div v-else class="py-12 text-center">
          <p class="text-sm text-muted-foreground">{{ t('ai_empty_result') }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 通知组件 -->
  <div class="fixed top-24 right-4 z-50 space-y-2">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg bg-card min-w-[300px]"
        :class="notification.type === 'success' ? 'border-green-500/50' : 'border-destructive/50'"
      >
        <Check
          v-if="notification.type === 'success'"
          class="h-5 w-5 text-green-500 flex-shrink-0"
        />
        <AlertTriangle v-else class="h-5 w-5 text-destructive flex-shrink-0" />
        <span class="text-sm flex-1">{{ notification.message }}</span>
        <button class="text-gray-400 hover:text-white" @click="removeNotification(notification.id)">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
.log-analysis-trigger {
  border: 1px solid hsl(var(--primary) / 0.25);
  background: linear-gradient(180deg, hsl(var(--primary) / 0.16), hsl(var(--primary) / 0.08));
  color: hsl(var(--primary));
  box-shadow: inset 0 1px 0 hsl(var(--primary) / 0.12);
}

.log-analysis-trigger:hover {
  background: linear-gradient(180deg, hsl(var(--primary) / 0.22), hsl(var(--primary) / 0.12));
}

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

/* 全屏视图过渡动画 */
.fullscreen-view-enter-active,
.fullscreen-view-leave-active {
  transition: all 0.3s ease;
}

.fullscreen-view-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.fullscreen-view-enter-to {
  opacity: 1;
  transform: scale(1);
}

.fullscreen-view-leave-from {
  opacity: 1;
  transform: scale(1);
}

.fullscreen-view-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.log-content {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  font-family: var(--font-mono);
  font-weight: 500;
  line-height: 1.15;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  letter-spacing: 0.02em;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.log-content * {
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: inherit;
}

.log-content p {
  line-height: inherit;
  margin: 0;
}

/* 移动端优化 - 更紧凑 */
@media (max-width: 767px) {
  .log-content .line-num {
    width: 35px;
    padding-right: 6px;
    margin-right: 6px;
  }
}

/* PC 端优化 - 更大字体，更紧凑行高 */
@media (min-width: 1024px) {
  .log-content .line-num {
    width: 50px;
    padding-right: 10px;
    margin-right: 10px;
  }
}

/* 通知动画 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* AI 分析流式动画延迟 */
.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}

.animate-spin-reverse {
  animation: spin-reverse 1s linear infinite;
}

@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
</style>
