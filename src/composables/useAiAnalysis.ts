import { ref, computed } from 'vue'
import { apiClient, type AiError } from '@/lib/ApiClient'
import { t } from '@/lib/i18n'

export function useAiAnalysis(logId: string) {
  const aiText = ref('')
  const aiLoading = ref(false)
  const aiError = ref('')
  const aiStreamingContent = ref('')
  const aiIsStreaming = ref(false)
  const aiIsCached = ref(false)
  const showAiPanel = ref(false)

  const aiStreamingLength = computed(() => aiStreamingContent.value.trim().length)
  const hasAiContent = computed(() => (aiIsStreaming.value ? aiStreamingContent.value : aiText.value).trim().length > 0)

  let scheduledFrame: number | null = null

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
        return error.message || t('ai_error_unknown')
    }
  }

  const loadAiAnalysis = async () => {
    aiLoading.value = true
    aiError.value = ''
    aiStreamingContent.value = ''
    aiIsStreaming.value = false
    aiIsCached.value = false
    aiText.value = ''

    try {
      await apiClient.streamAiAnalysis(logId, {
        onChunk: (chunk: string) => {
          aiIsStreaming.value = true
          aiStreamingContent.value += chunk
          // 使用 requestAnimationFrame 节流渲染，避免每个 chunk 都触发 Vue 更新
          if (!scheduledFrame) {
            scheduledFrame = requestAnimationFrame(() => {
              aiText.value = aiStreamingContent.value
              scheduledFrame = null
            })
          }
        },
        onDone: (text: string, cached: boolean) => {
          if (scheduledFrame) {
            cancelAnimationFrame(scheduledFrame)
            scheduledFrame = null
          }
          aiText.value = text
          aiStreamingContent.value = text
          aiIsStreaming.value = false
          aiIsCached.value = cached
          aiLoading.value = false
        },
        onError: (error: AiError) => {
          aiError.value = mapAiErrorMessage(error)
          aiIsStreaming.value = false
          aiLoading.value = false
        }
      })
    } catch (e: any) {
      console.error('AI analysis error:', e)
      aiError.value = e.response?.data?.message || t('ai_analysis_failed')
      aiLoading.value = false
      aiIsStreaming.value = false
    }
  }

  const openAiPanel = () => {
    showAiPanel.value = true
    if (!aiStreamingContent.value && !aiLoading.value && !aiError.value) {
      loadAiAnalysis()
    }
  }

  const closeAiPanel = () => {
    showAiPanel.value = false
  }

  return {
    aiText,
    aiLoading,
    aiError,
    aiStreamingContent,
    aiIsStreaming,
    aiIsCached,
    showAiPanel,
    aiStreamingLength,
    hasAiContent,
    loadAiAnalysis,
    openAiPanel,
    closeAiPanel
  }
}
