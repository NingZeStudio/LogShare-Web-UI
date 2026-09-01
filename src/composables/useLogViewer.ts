import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient, type LogMetaResponse } from '@/lib/ApiClient'
import { parseLog } from '@/lib/logParser'
import { setPageTitle } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'
import { toast } from '@/lib/toast'

export function useLogViewer(logId: string) {
  const router = useRouter()
  const log = ref<any>(null)
  const logMeta = ref<LogMetaResponse | null>(null)
  const logContent = ref('')
  const loading = ref(true)
  const error = ref('')
  const showErrorsOnly = ref(false)
  const wrapLines = ref(false)
  const isFullscreen = ref(false)
  const isCopySuccess = ref(false)
  const isDeleting = ref(false)
  const logToken = ref<string | null>(null)
  const logFontSize = ref(12)
  const isEditingFontSize = ref(false)
  const fontSizeInput = ref('12')
  const originalLogText = ref('')
  const mainRawText = ref('')
  const problemsSection = ref<HTMLElement | null>(null)

  const addNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') toast.success(message)
    else toast.error(message)
  }

  const init = () => {
    logToken.value = localStorage.getItem(`log_token_${logId}`)
    const savedFontSize = localStorage.getItem('log_font_size')
    if (savedFontSize) {
      const val = parseInt(savedFontSize)
      if (!isNaN(val) && val >= 8 && val <= 48) {
        logFontSize.value = val
      }
    }
  }

  const loadLog = async () => {
    try {
      const rawRes = await apiClient.get(`/v1/raw/${logId}`)
      const rawText = typeof rawRes.data === 'string' ? rawRes.data : JSON.stringify(rawRes.data)

      mainRawText.value = rawText
      originalLogText.value = rawText
      logContent.value = await parseLog(rawText)

      // 分析结果为可选增强，失败时静默降级（正文照常展示）
      try {
        const insightsRes = await apiClient.get(`/v1/insights/${logId}`)
        log.value = insightsRes.data
      } catch (e) {
        console.warn('Failed to load insights:', e)
        log.value = null
      }

      if (log.value?.title) {
        setPageTitle('log', { title: log.value.title, id: logId })
      } else {
        setPageTitle('log', { id: logId })
      }

      // 附加元信息与文件列表（独立请求，失败不阻塞正文展示）
      try {
        logMeta.value = await apiClient.getLogMeta(logId)
      } catch (e) {
        console.warn('Failed to load log meta:', e)
      }
    } catch (e: any) {
      console.error('Failed to load log:', e)
      const status = e.response?.status
      if (status === 404) {
        error.value = t('log_not_found')
      } else if (status === 429) {
        error.value = t('log_rate_limited')
      } else {
        error.value = e.response?.data?.error || e.response?.data?.message || t('log_load_failed')
      }
    } finally {
      loading.value = false
    }
  }

  /** 切换正文渲染为指定文本（附加文件查看） */
  const applyRawText = async (text: string) => {
    originalLogText.value = text
    logContent.value = await parseLog(text)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** 恢复渲染主文件 */
  const restoreMain = async () => {
    if (!mainRawText.value) return
    originalLogText.value = mainRawText.value
    logContent.value = await parseLog(mainRawText.value)
  }

  const toggleErrors = () => {
    showErrorsOnly.value = !showErrorsOnly.value
  }

  const deleteLog = async () => {
    isDeleting.value = true
    try {
      if (logToken.value) {
        const result = await apiClient.deleteLog(logId, logToken.value)
        if (result.success) {
          localStorage.removeItem(`log_token_${logId}`)
          router.push('/')
          addNotification('success', t('delete_log_success'))
        } else {
          addNotification(
            'error',
            t('delete_log_failed') +
              ': ' +
              (result.failed[0]?.error || result.failed[0]?.message || '')
          )
        }
      } else {
        addNotification('error', t('delete_log_no_token'))
      }
    } catch (e: any) {
      console.error('Delete error:', e)
      addNotification(
        'error',
        e.response?.data?.error || e.response?.data?.message || t('delete_log_failed')
      )
    } finally {
      isDeleting.value = false
    }
  }

  const copyShareMessage = async () => {
    if (!log.value || !log.value.title) {
      try {
        const insightsRes = await apiClient.get(`/v1/insights/${logId}`)
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
      addNotification('error', t('share_failed'))
    }
  }

  const downloadLog = () => {
    const text = originalLogText.value
    if (!text) {
      addNotification('error', t('download_failed'))
      return
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${logId}.log`)
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

  const startEditFontSize = () => {
    fontSizeInput.value = String(logFontSize.value)
    isEditingFontSize.value = true
  }

  const cancelFontSizeEdit = () => {
    isEditingFontSize.value = false
  }

  const applyFontSize = () => {
    const val = parseInt(fontSizeInput.value)
    if (!isNaN(val) && val >= 8 && val <= 48) {
      logFontSize.value = val
      saveFontSize()
    }
    isEditingFontSize.value = false
  }

  const saveFontSize = () => {
    localStorage.setItem('log_font_size', String(logFontSize.value))
  }

  return {
    log,
    logMeta,
    logContent,
    loading,
    error,
    showErrorsOnly,
    wrapLines,
    isFullscreen,
    isCopySuccess,
    isDeleting,
    logToken,
    logFontSize,
    isEditingFontSize,
    fontSizeInput,
    originalLogText,
    problemsSection,
    init,
    loadLog,
    applyRawText,
    restoreMain,
    toggleErrors,
    deleteLog,
    copyShareMessage,
    downloadLog,
    enterFullscreen,
    exitFullscreen,
    scrollToTop,
    increaseFontSize,
    decreaseFontSize,
    startEditFontSize,
    cancelFontSizeEdit,
    applyFontSize,
    addNotification
  }
}
