import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '@/lib/ApiClient'
import { parseLog } from '@/lib/logParser'
import { setPageTitle } from '@/lib/pageTitle'
import { t } from '@/lib/i18n'

export interface Notification {
  id: number
  type: 'success' | 'error'
  message: string
}

export function useLogViewer(logId: string) {
  const router = useRouter()
  const log = ref<any>(null)
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
  const fontSizeInputEl = ref<HTMLInputElement | null>(null)
  const notifications = ref<Notification[]>([])
  const originalLogText = ref('')
  const problemsSection = ref<HTMLElement | null>(null)

  let notificationId = 0

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
      const [rawRes, insightsRes] = await Promise.all([
        apiClient.get(`/1/raw/${logId}`),
        apiClient.get(`/1/insights/${logId}`)
      ])

      log.value = insightsRes.data
      const rawText = typeof rawRes.data === 'string' ? rawRes.data : JSON.stringify(rawRes.data)

      originalLogText.value = rawText
      logContent.value = parseLog(rawText)

      if (log.value?.title) {
        setPageTitle('log', { title: log.value.title, id: logId })
      } else {
        setPageTitle('log', { id: logId })
      }
    } catch (e: any) {
      console.error('Failed to load log:', e)
      error.value = e.response?.data?.message || t('log_not_found')
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
        const result = await apiClient.deleteLog(logId, logToken.value)
        if (result.success) {
          localStorage.removeItem(`log_token_${logId}`)
          router.push('/')
          addNotification('success', t('delete_log_success'))
        } else {
          addNotification(
            'error',
            t('delete_log_failed') + ': ' + (result.failed[0]?.message || '')
          )
        }
      } else {
        addNotification('error', t('delete_log_no_token'))
      }
    } catch (e: any) {
      console.error('Delete error:', e)
      addNotification('error', e.response?.data?.message || t('delete_log_failed'))
    } finally {
      isDeleting.value = false
    }
  }

  const copyShareMessage = async () => {
    if (!log.value || !log.value.title) {
      try {
        const insightsRes = await apiClient.get(`/1/insights/${logId}`)
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

  return {
    log,
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
    fontSizeInputEl,
    notifications,
    originalLogText,
    problemsSection,
    init,
    loadLog,
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
    applyFontSize,
    handleFontSizeKeydown,
    addNotification,
    removeNotification
  }
}
