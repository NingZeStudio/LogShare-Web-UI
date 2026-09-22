import { ref, computed } from 'vue'
import { apiClient, type AiError, type AiStatusEvent } from '@/lib/ApiClient'
import { t } from '@/lib/i18n'

export interface AiStatusEntry {
  id: number
  type: AiStatusEvent['type']
  name?: string
  arguments?: unknown
  delta?: string
  summary?: string
  position?: number
  truncated?: boolean
}

export interface AiStatusBlock {
  id: number
  type: 'queued' | 'thinking' | 'tool' | 'limit'
  title: string
  detail: string
  argumentsText?: string
  completed: boolean
  expanded: boolean
  truncated?: boolean
}

export interface AiStructuredResult {
  rootCause: string
  confidence: number
  evidence: string[]
  steps: string[]
  rawJson?: string
}

function formatToolArguments(args: unknown): string {
  if (!args) return ''
  if (typeof args === 'string') return args
  if (typeof args === 'object') {
    try {
      const entries = Object.entries(args as Record<string, unknown>)
      if (entries.length === 0) return ''
      return entries
        .map(([k, v]) => `${k}=${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
        .join(', ')
    } catch {
      return JSON.stringify(args)
    }
  }
  return String(args)
}

export function parseStructuredResult(content: string): {
  structured: AiStructuredResult | null
  cleanContent: string
} {
  if (!content) {
    return { structured: null, cleanContent: '' }
  }

  // 1. 首选匹配正文末尾或中的 ```json ... ``` 代码块
  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"rootCause"[\s\S]*?\})\s*```/i
  const blockMatch = content.match(jsonBlockRegex)
  if (blockMatch && blockMatch[1]) {
    try {
      const parsed = JSON.parse(blockMatch[1])
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.rootCause === 'string' &&
        parsed.rootCause.trim() !== ''
      ) {
        const clean = content.replace(blockMatch[0], '').trimEnd()
        return {
          structured: {
            rootCause: parsed.rootCause.trim(),
            confidence:
              typeof parsed.confidence === 'number'
                ? Math.max(0, Math.min(1, parsed.confidence))
                : 0.8,
            evidence: Array.isArray(parsed.evidence)
              ? parsed.evidence.map(String).filter(Boolean)
              : [],
            steps: Array.isArray(parsed.steps) ? parsed.steps.map(String).filter(Boolean) : [],
            rawJson: blockMatch[1].trim()
          },
          cleanContent: clean
        }
      }
    } catch {
      // 格式容错继续
    }
  }

  // 2. 次选：正文末尾未带代码块围栏的纯 JSON 对象
  const rawJsonRegex = /(\{[\s\S]*?"rootCause"[\s\S]*?\})\s*$/i
  const rawMatch = content.match(rawJsonRegex)
  if (rawMatch && rawMatch[1]) {
    try {
      const parsed = JSON.parse(rawMatch[1])
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.rootCause === 'string' &&
        parsed.rootCause.trim() !== ''
      ) {
        const clean = content.slice(0, rawMatch.index).trimEnd()
        return {
          structured: {
            rootCause: parsed.rootCause.trim(),
            confidence:
              typeof parsed.confidence === 'number'
                ? Math.max(0, Math.min(1, parsed.confidence))
                : 0.8,
            evidence: Array.isArray(parsed.evidence)
              ? parsed.evidence.map(String).filter(Boolean)
              : [],
            steps: Array.isArray(parsed.steps) ? parsed.steps.map(String).filter(Boolean) : [],
            rawJson: rawMatch[1].trim()
          },
          cleanContent: clean
        }
      }
    } catch {
      // ignore
    }
  }

  return { structured: null, cleanContent: content }
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
          argumentsText: formatToolArguments(entry.arguments),
          completed: false,
          expanded: expandedStatusIds.value.has(entry.id)
        })
      } else if (entry.type === 'tool_result') {
        const previous = blocks[blocks.length - 1]
        if (previous?.type === 'tool' && !previous.completed) {
          previous.completed = true
          previous.title = getToolResultTitle(entry.name, entry.summary)
          previous.detail = entry.summary || previous.detail
          previous.truncated = entry.truncated
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
    const queued = blocks.find(b => b.type === 'queued')
    if (queued && !queued.completed && (blocks.length > 1 || aiText.value)) {
      queued.completed = true
      queued.title = t('ai_status_queued_done')
    }
    return blocks
  })

  const getToolTitle = (name?: string) => {
    if (name === 'rag_search') return '正在检索知识库…'
    if (name === 'list_topics') return '正在浏览知识库主题…'
    if (name === 'list_log_files') return '正在列出日志文件…'
    if (name === 'read_log_file') return '正在读取日志文件…'
    if (name === 'grep_log_file') return '正在检索日志内容…'
    if (name === 'web_search_exa') return '正在搜索网络资料…'
    if (name === 'github_list_repos') return '正在获取关联仓库列表…'
    if (name === 'github_search') return '正在检索 GitHub Issues / PRs…'
    if (name === 'github_get_content') return '正在读取 GitHub 详情…'
    return `正在调用 ${name || '工具'}…`
  }

  const getToolResultTitle = (name?: string, summary?: string) => {
    const text = summary?.trim() || ''

    if (name === 'list_log_files') {
      const matchNum = text.match(/(?:共|包含)\s*(\d+)\s*个文件/)
      if (matchNum) {
        return `列出 ${matchNum[1]} 个文件`
      }
      const bullets = (text.match(/^\s*-\s+/gm) || []).length
      if (bullets > 0) {
        return `列出 ${bullets} 个文件`
      }
      if (text.includes('未绑定日志') || text.includes('日志不存在')) {
        return '未获取到日志文件'
      }
      return '列出 1 个文件'
    }

    if (name === 'github_list_repos') {
      const matchNum = text.match(/共\s*(\d+)\s*个仓库/)
      if (matchNum) {
        return `列出 ${matchNum[1]} 个仓库`
      }
      const bullets = (text.match(/^\s*-\s+\*\*/gm) || text.match(/^\s*-\s+/gm) || []).length
      if (bullets > 0) {
        return `列出 ${bullets} 个仓库`
      }
      return '列出 0 个仓库'
    }

    if (name === 'rag_search') {
      const matchHits = text.match(/共命中\s*(\d+)\s*条/) || text.match(/找到\s*(\d+)\s*条/)
      if (matchHits) {
        const count = Number(matchHits[1])
        return count > 0 ? `搜索到 ${count} 个结果` : '未搜索到相关结果'
      }
      const itemHits = (text.match(/^\s*\[\d+\]/gm) || []).length
      if (itemHits > 0) {
        return `搜索到 ${itemHits} 个结果`
      }
      if (text.includes('未找到') || text.includes('无相关')) {
        return '未搜索到相关结果'
      }
      return '知识库搜索完成'
    }

    if (name === 'grep_log_file') {
      const matchGrep = text.match(/共找到\s*(\d+)\s*处匹配/) || text.match(/(\d+)\s*处匹配/)
      if (matchGrep) {
        const count = Number(matchGrep[1])
        return count > 0 ? `检索到 ${count} 段日志内容` : '未检索到匹配的日志内容'
      }
      const markCount = (text.match(/^\s*>\s*\d+\s*\|/gm) || []).length
      if (markCount > 0) {
        return `检索到 ${markCount} 段日志内容`
      }
      if (text.includes('未找到') || text.includes('未检索到')) {
        return '未检索到匹配的日志内容'
      }
      return '日志检索完成'
    }

    if (name === 'github_search') {
      const issues = (text.match(/\[Issue\s*#\d+/gi) || []).length
      const prs = (text.match(/\[PR\s*#\d+/gi) || []).length
      const discussions = (text.match(/\[Discussion\s*#\d+/gi) || []).length
      const parts: string[] = []
      if (issues > 0) parts.push(`${issues} 个 Issue`)
      if (prs > 0) parts.push(`${prs} 个 PR`)
      if (discussions > 0) parts.push(`${discussions} 个 Discussion`)

      if (parts.length > 0) {
        return `搜索到 ${parts.join('、')}`
      }

      const matchTotal = text.match(/共\s*(\d+)\s*条/) || text.match(/找到\s*(\d+)\s*个匹配/)
      if (matchTotal) {
        const count = Number(matchTotal[1])
        return count > 0 ? `搜索到 ${count} 个 Issue/PR` : '未搜索到相关 Issue/PR'
      }
      if (text.includes('未找到') || text.includes('0 条')) {
        return '未搜索到相关 Issue/PR'
      }
      return 'GitHub 检索完成'
    }

    if (name === 'read_log_file') {
      const mFile = text.match(/文件\s+([^\s（(]+)/)
      const filename = mFile ? mFile[1] : 'main'
      const mRange = text.match(/本次行区间=(\d+)-(\d+)/)
      if (mRange) {
        const lines = Number(mRange[2]) - Number(mRange[1]) + 1
        return `读取了 ${filename}（${lines} 行）`
      }
      const mTotal = text.match(/共\s*(\d+)\s*行/)
      if (mTotal) {
        return `读取了 ${filename}（共 ${mTotal[1]} 行）`
      }
      return `读取了文件 ${filename}`
    }

    if (name === 'github_get_content') {
      const m = text.match(/\[(Issue|PR|Discussion)\s*#(\d+)/i)
      if (m) {
        return `读取了 ${m[1]} #${m[2]} 详情`
      }
      return '读取 GitHub 详情完成'
    }

    if (name === 'list_topics') {
      const matchTopics = text.match(/共收录\s*(\d+)\s*个主题/)
      if (matchTopics) {
        return `列出 ${matchTopics[1]} 个知识库主题`
      }
      const count = (text.match(/■/g) || []).length
      if (count > 0) {
        return `列出 ${count} 个知识库主题`
      }
      return '列出知识库主题完成'
    }

    if (name === 'web_search_exa') {
      // 外部 MCP 除外：保持简洁概括
      return '网络资料查阅完成'
    }

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

  const showRawJson = ref(false)
  const toggleRawJson = () => {
    showRawJson.value = !showRawJson.value
  }

  const structuredAnalysis = computed(() => {
    const raw = aiIsStreaming.value ? aiStreamingContent.value : aiText.value
    return parseStructuredResult(raw)
  })

  const structuredResult = computed(() => structuredAnalysis.value.structured)
  const hasStructuredResult = computed(() =>
    Boolean(structuredResult.value && structuredResult.value.rootCause)
  )
  const displayMarkdown = computed(() => structuredAnalysis.value.cleanContent)

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
        pushStatus({ type: 'tool', name: status.name, arguments: status.arguments })
        break
      case 'tool_result':
        pushStatus({
          type: 'tool_result',
          name: status.name,
          summary: status.summary,
          truncated: status.truncated
        })
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
    showRawJson.value = false

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
    structuredResult,
    hasStructuredResult,
    displayMarkdown,
    showRawJson,
    toggleRawJson,
    loadAiAnalysis,
    openAiPanel,
    closeAiPanel
  }
}
