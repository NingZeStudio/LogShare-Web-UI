import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// 生产直连线上 API；开发走 vite.config.ts 的 server.proxy（同源转发到 127.0.0.1:9501，规避跨域）
const baseURL = import.meta.env.DEV ? '' : 'https://api.logshare.cn'

export interface LogSubmitFile {
  name: string
  content: string
}

export interface LogSubmitParams {
  content?: string
  files?: LogSubmitFile[]
  metadata?: Array<{
    key: string
    value: any
    label?: string
    visible?: boolean
  }>
  source?: string
}

export interface LogSubmitResponse {
  success: boolean
  message: string
  id: string
  url: string
  raw: string
  token: string
}

export interface LogFileItem {
  name: string
  size: number
}

export interface LogMetaResponse {
  success: boolean
  message: string
  id: string
  size: number
  lines: number
  created: number
  expires: number
  metadata: Array<{
    key: string
    value: any
    label?: string
    visible?: boolean
  }>
  source: string
  files: LogFileItem[]
  raw: string
}

export interface DeleteResponse {
  success: boolean
  message?: string
  deleted: string[]
  failed: Array<{
    id: string
    message?: string
    error?: string
    code: number
  }>
  total: number
  deletedCount: number
  failedCount: number
}

export interface LimitsResponse {
  storageTime: number
  maxLength: number
  maxLines: number
}

export interface FiltersResponse {
  success: boolean
  filters: Array<{
    type: string
    data: any
  }>
}

export interface AiError {
  success: false
  message?: string
  error?: string
  /** 上游返回的原始响应体（JSON 文本），用于前端透传展示 */
  raw?: string
  code?: number
  type?:
    | 'not_found'
    | 'analysis_failed'
    | 'rate_limit'
    | 'server_error'
    | 'parse_error'
    | 'disabled'
}

export interface AiStatusEvent {
  type: 'thinking' | 'tool' | 'tool_result' | 'limit'
  delta?: string
  name?: string
  arguments?: unknown
  summary?: string
  truncated?: boolean
  rounds?: number
}

export interface AiStreamCallbacks {
  onChunk?: (text: string) => void
  onStatus?: (status: AiStatusEvent) => void
  onDone?: (text: string, cached: boolean) => void
  onError?: (error: AiError) => void
}

export class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        Accept: 'application/json'
      },
      withCredentials: false
    })

    this.client.interceptors.response.use(
      response => response,
      error => {
        if (import.meta.env.DEV) {
          console.error('API 请求错误:', {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
            config: {
              method: error.config?.method,
              url: error.config?.url
            }
          })
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const postConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      }
    }
    return this.client.post<T>(url, data, postConfig)
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  /**
   * 消费 SSE 流：兼容旧协议（data: 正文增量 + event: done）与 LogAgent 新协议（event: status）
   */
  private async consumeSse(
    url: string,
    options: RequestInit,
    callbacks: AiStreamCallbacks
  ): Promise<void> {
    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        // 保留原始响应体用于前端透传展示，同时尽力解析结构化字段
        const rawBody = await response.text().catch(() => '')
        let errorData: any = null
        try {
          errorData = JSON.parse(rawBody)
        } catch {
          errorData = null
        }
        const detail = errorData?.error || errorData?.message || rawBody || `HTTP ${response.status}`
        const disabled = errorData?.error === 'AI analysis is disabled.'
        callbacks.onError?.({
          success: false,
          message: detail,
          error: errorData?.error,
          raw: rawBody || undefined,
          code: response.status,
          type: disabled
            ? 'disabled'
            : response.status === 429
              ? 'rate_limit'
              : response.status === 404
                ? 'not_found'
                : 'server_error'
        })
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError?.({
          success: false,
          message: '浏览器不支持流式响应',
          type: 'server_error'
        })
        return
      }

      let fullText = ''
      const decoder = new TextDecoder()
      let buffer = ''
      let streamDone = false
      let currentEvent = ''

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n')
        buffer = parts.pop() || ''

        for (const rawLine of parts) {
          const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine

          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
            if (currentEvent === 'done') {
              streamDone = true
              break
            }
            continue
          }

          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') continue

          try {
            const payload = JSON.parse(data)

            if (currentEvent === 'status') {
              callbacks.onStatus?.(payload as AiStatusEvent)
              currentEvent = ''
              continue
            }

            // 文档约定：event: error 的 data.error 为错误信息，收到后终止流
            if (currentEvent === 'error') {
              streamDone = true
              const detail = payload.error || payload.message || ''
              callbacks.onError?.({
                success: false,
                message: detail || 'AI analysis failed',
                error: detail || undefined,
                raw: JSON.stringify(payload, null, 2),
                code: typeof payload.code === 'number' ? payload.code : undefined,
                type: detail ? 'server_error' : 'analysis_failed'
              })
              break
            }

            const content = payload.choices?.[0]?.delta?.content
            if (content) {
              fullText += content
              callbacks.onChunk?.(content)
            }
          } catch {
            // 忽略非 JSON 行
          }
        }
      }

      callbacks.onDone?.(fullText, false)
    } catch (e: any) {
      callbacks.onError?.({
        success: false,
        message: e.message || '网络请求失败',
        type: 'server_error'
      })
    }
  }

  /**
   * SSE 流式 AI 分析（基于已存储日志）
   */
  async streamAiAnalysis(id: string, callbacks: AiStreamCallbacks): Promise<void> {
    await this.consumeSse(
      `${baseURL}/v1/ai/${id}`,
      { headers: { Accept: 'text/event-stream' } },
      callbacks
    )
  }

  /**
   * SSE 流式 AI 分析（通过内容，可选绑定已存在日志 ID）
   */
  async streamAiAnalyseByContent(
    content: string,
    callbacks: AiStreamCallbacks,
    logId?: string
  ): Promise<void> {
    await this.consumeSse(
      `${baseURL}/v1/ai/analyse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify({ content, ...(logId ? { id: logId } : {}) })
      },
      callbacks
    )
  }

  /**
   * 提交日志
   */
  async submitLog(params: LogSubmitParams): Promise<LogSubmitResponse> {
    const response = await this.post<LogSubmitResponse>('/v1/log', params)
    return response.data
  }

  /**
   * 获取原始日志
   */
  async getRawLog(id: string): Promise<string> {
    const response = await this.get<string>(`/v1/raw/${id}`, {
      headers: { Accept: 'text/plain' }
    })
    return response.data
  }

  /**
   * 获取日志元信息与附加文件列表
   */
  async getLogMeta(id: string): Promise<LogMetaResponse> {
    const response = await this.get<LogMetaResponse>(`/v1/log/${id}`)
    return response.data
  }

  /**
   * 获取日志的附加文件原文
   * 注意：子路径分隔符不可编码（后端按原始路径段路由），仅对各段做 URI 编码
   */
  async getRawFile(id: string, filename: string): Promise<string> {
    const path = filename
      .split('/')
      .map(encodeURIComponent)
      .join('/')
    const response = await this.get<string>(`/v1/raw/${id}/${path}`, {
      headers: { Accept: 'text/plain' }
    })
    return response.data
  }

  /**
   * 获取日志洞察
   */
  async getInsights(id: string) {
    const response = await this.get(`/v1/insights/${id}`)
    return response.data
  }

  /**
   * 删除日志（支持单个和多个）
   */
  async deleteLog(id: string | string[], token: string): Promise<DeleteResponse> {
    const ids = Array.isArray(id) ? id.join(',') : id
    const response = await this.delete<DeleteResponse>(`/v1/log/${ids}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    })
    return response.data
  }

  /**
   * 获取限制信息
   */
  async getLimits(): Promise<LimitsResponse> {
    const response = await this.get<LimitsResponse>('/v1/limits')
    return response.data
  }

  /**
   * 获取过滤器信息
   */
  async getFilters(): Promise<FiltersResponse> {
    const response = await this.get<FiltersResponse>('/v1/filters')
    return response.data
  }
}

export const apiClient = new ApiClient()

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  return `${baseURL}/${cleanEndpoint}`
}

export default apiClient
