import { ref, computed } from 'vue'
import { apiClient, type AiError, type AiStatusEvent } from '@/lib/ApiClient'
import { t } from '@/lib/i18n'

export interface AiStatusEntry {
  id: number
  type: AiStatusEvent['type']
  name?: string
  delta?: string
  summary?: string
  position?: number
}

export interface AiStatusBlock {
  id: number
  type: 'queued' | 'thinking' | 'tool' | 'limit'
  title: string
  detail: string
  completed: boolean
  expanded: boolean
}

export function useAiAnalysis(logId: string) {
  const aiText = ref('')
  const aiLoading = ref(false)
  const aiError = ref('')
  /** 上游返回的原始响应体（JSON 文本），用于代码块透传展示 */
  const aiRawError = ref('')
  const aiStreamingContent = ref('')
  const aiIsStreaming = ref(false)
  const aiIsCached = ref(false)
  const showAiPanel = ref(false)
  const aiStatusEntries = ref<AiStatusEntry[]>([])
  const expandedStatusIds = ref(new Set<number>())

  const aiStreamingLength = computed(() => aiStreamingContent.value.trim().length)
  const hasAiContent = computed(
    () => (aiIsStreaming.value ? aiStreamingContent.value : aiText.value).trim().length > 0
  )
  const hasAiStatus = computed(() => aiStatusEntries.value.length > 0)
  const aiStatusBlocks = computed<AiStatusBlock[]>(() => {
    const blocks: AiStatusBlock[] = []
    for (const entry of aiStatusEntries.value) {
      if (entry.type === 'queued') {
        blocks.push({
          id: entry.id,
          type: 'queued',
          title: t('ai_status_queued').replace('{count}', String(entry.position ?? 0)),
          detail: entry.position ? `前方约 ${entry.position} 个任务等待处理` : '正在排队等待分析',
          completed: false,
          expanded: expandedStatusIds.value.has(entry.id)
        })
      } else if (entry.type === 'thinking') {
        const previous = blocks[blocks.length - 1]
        if (previous?.type === 'thinking' && !previous.completed) {
          previous.detail += entry.delta || ''
        } else {
          blocks.push({
            id: entry.id,
            type: 'thinking',
            title: '正在思考中…',
            detail: entry.delta || '',
            completed: false,
            expanded: expandedStatusIds.value.has(entry.id)
          })
        }
      } else if (entry.type === 'tool') {
        blocks.push({
          id: entry.id,
          type: 'tool',
          title: getToolTitle(entry.name),
          detail: entry.name || '',
          completed: false,
          expanded: expandedStatusIds.value.has(entry.id)
        })
      } else if (entry.type === 'tool_result') {
        const previous = blocks[blocks.length - 1]
        if (previous?.type === 'tool' && !previous.completed) {
          previous.completed = true
          previous.title = getToolResultTitle(entry.name, entry.summary)
          previous.detail = entry.summary || previous.detail
        }
      } else if (entry.type === 'limit') {
        blocks.push({
          id: entry.id,
          type: 'limit',
          title: '已达到工具调用上限',
          detail: '',
          completed: true,
          expanded: false
        })
      }
    }
    const last = blocks[blocks.length - 1]
    if (last?.type === 'thinking' && !last.completed && aiText.value) {
      last.completed = true
      last.title = '已完成思考'
    }
    // 排队块在分析真正开始（出现后续步骤或正文）后标记完成
    const queued = blocks.find((b) => b.type === 'queued')
    if (queued && !queued.completed && (blocks.length > 1 || aiText.value)) {
      queued.completed = true
      queued.title = t('ai_status_queued_done')
    }
    return blocks
  })

  const getToolTitle = (name?: string) => {
    if (name === 'rag_search') return '正在查阅知识库…'
    if (name === 'list_topics') return '正在浏览知识库主题…'
    if (name === 'list_log_files' || name === 'read_log_file') return '正在查看日志文件…'
    if (name === 'grep_log_file') return '正在检索日志内容…'
    if (name === 'web_search_exa') return '正在搜索网络资料…'
    return `正在调用 ${name || '工具'}…`
  }

  const getToolResultTitle = (name?: string, _summary?: string) => {
    if (name === 'rag_search' || name === 'list_topics') return '知识库查阅完成'
    if (name === 'list_log_files' || name === 'read_log_file') return '日志文件查看完成'
    if (name === 'grep_log_file') return '日志检索完成'
    if (name === 'web_search_exa') return '网络资料查阅完成'
    return `${name || '工具'}执行完成`
  }

  const toggleStatusBlock = (id: number) => {
    const next = new Set(expandedStatusIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expandedStatusIds.value = next
  }

  const aiActivity = computed(() => {
    if (!aiLoading.value && !aiIsStreaming.value) return null
    const latest = aiStatusEntries.value[aiStatusEntries.value.length - 1]
    if (!latest) return null
    if (latest.type === 'queued') return { type: 'queued' as const, name: '' }
    if (latest.type === 'thinking') return { type: 'thinking' as const, name: '' }
    if (latest.type === 'tool') return { type: 'tool' as const, name: latest.name || '工具' }
    if (latest.type === 'tool_result') {
      return { type: 'tool_result' as const, name: latest.name || '工具' }
    }
    return { type: 'limit' as const, name: '' }
  })

  let scheduledFrame: number | null = null
  let statusId = 0

  const mapAiErrorMessage = (error: AiError) => {
    switch (error.type) {
      case 'not_found':
        return t('ai_error_not_found')
      case 'rate_limit':
        return t('ai_error_rate_limit')
      case 'disabled':
        return t('ai_error_disabled')
      case 'analysis_failed':
      case 'parse_error':
        return t('ai_error_parse')
      case 'server_error':
        return t('ai_error_server')
      default:
        return error.message || error.error || t('ai_error_unknown')
    }
  }

  const pushStatus = (entry: Omit<AiStatusEntry, 'id'>) => {
    aiStatusEntries.value.push({ id: ++statusId, ...entry })
  }

  const handleStatus = (status: AiStatusEvent) => {
    switch (status.type) {
      case 'queued':
        pushStatus({ type: 'queued', position: status.position })
        break
      case 'thinking':
        if (status.delta) pushStatus({ type: 'thinking', delta: status.delta })
        break
      case 'tool':
        pushStatus({ type: 'tool', name: status.name })
        break
      case 'tool_result':
        pushStatus({ type: 'tool_result', name: status.name, summary: status.summary })
        break
      case 'limit':
        pushStatus({ type: 'limit' })
        break
    }
  }

  const loadAiAnalysis = async () => {
    aiLoading.value = true
    aiError.value = ''
    aiRawError.value = ''
    aiStreamingContent.value = ''
    aiIsStreaming.value = false
    aiIsCached.value = false
    aiText.value = ''
    aiStatusEntries.value = []
    expandedStatusIds.value = new Set()

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
        onStatus: handleStatus,
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
          aiRawError.value = error.raw || ''
          aiIsStreaming.value = false
          aiLoading.value = false
        }
      })
    } catch (e: any) {
      console.error('AI analysis error:', e)
      const data = e.response?.data
      if (data != null) {
        try {
          aiRawError.value = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        } catch {
          aiRawError.value = ''
        }
      }
      aiError.value =
        e.response?.data?.error || e.response?.data?.message || t('ai_analysis_failed')
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
    aiRawError,
    aiStreamingContent,
    aiIsStreaming,
    aiIsCached,
    showAiPanel,
    aiStreamingLength,
    hasAiContent,
    aiStatusEntries,
    hasAiStatus,
    aiStatusBlocks,
    toggleStatusBlock,
    aiActivity,
    loadAiAnalysis,
    openAiPanel,
    closeAiPanel
  }
}
