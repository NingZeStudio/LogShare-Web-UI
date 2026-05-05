import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// 警告：硬编码 API 地址，修改时需同步更新 vite.config.ts 中的代理配置
const baseURL = 'https://api.logshare.cn'

export interface LogSubmitParams {
  content: string
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

export interface DeleteResponse {
  success: boolean
  deleted: string[]
  failed: Array<{
    id: string
    message: string
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

export interface AiAnalysisResult {
  summary: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  issues: Array<{
    type: string
    description: string
    suggestion?: string
  }>
  recommendations: string[]
}

export interface AiCachedResponse {
  success: boolean
  message: string
  analysis: AiAnalysisResult
  cached: true
}

export interface AiError {
  success: false
  error: string
  code?: number
  type?: 'not_found' | 'analysis_failed' | 'rate_limit' | 'server_error' | 'parse_error'
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
        console.error('API 请求错误:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
          config: {
            method: error.config?.method,
            url: error.config?.url
          }
        })
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
   * SSE 流式 AI 分析
   * 支持流式输出和缓存直接返回两种情况
   */
  async streamAiAnalysis(
    id: string,
    callbacks: {
      onChunk?: (chunk: string) => void
      onDone?: (analysis: AiAnalysisResult, cached: boolean) => void
      onError?: (error: AiError) => void
    }
  ): Promise<void> {
    const url = `${baseURL}/1/ai/${id}`

    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/event-stream' }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        callbacks.onError?.({
          success: false,
          error: errorData?.error || `HTTP ${response.status}`,
          code: response.status,
          type: response.status === 404 ? 'not_found' : 'server_error'
        })
        return
      }

      // 检测是否为缓存命中（普通 JSON）还是 SSE 流
      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        // 缓存直接返回
        const data = await response.json()
        if (data.success && data.analysis) {
          callbacks.onDone?.(data.analysis, true)
        } else {
          callbacks.onError?.({
            success: false,
            error: data.error || '分析结果格式错误',
            type: 'parse_error'
          })
        }
        return
      }

      // SSE 流式处理
      let fullJson = ''
      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError?.({
          success: false,
          error: '浏览器不支持流式响应',
          type: 'server_error'
        })
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data.trim() === '[DONE]') continue

            try {
              const chunk = JSON.parse(data)
              const content = chunk.choices?.[0]?.delta?.content
              if (content) {
                fullJson += content
                callbacks.onChunk?.(fullJson)
              }
            } catch {
              // 忽略解析错误，可能是分块传输中的不完整 JSON
            }
          }
        }
      }

      // 流结束后解析完整 JSON
      try {
        const analysis: AiAnalysisResult = JSON.parse(fullJson)
        callbacks.onDone?.(analysis, false)
      } catch {
        callbacks.onError?.({
          success: false,
          error: 'AI 分析结果解析失败',
          type: 'analysis_failed'
        })
      }
    } catch (e: any) {
      callbacks.onError?.({
        success: false,
        error: e.message || '网络请求失败',
        type: 'server_error'
      })
    }
  }

  /**
   * SSE 流式 AI 分析（通过内容）
   */
  async streamAiAnalyseByContent(
    content: string,
    callbacks: {
      onChunk?: (chunk: string) => void
      onDone?: (analysis: AiAnalysisResult, cached: boolean) => void
      onError?: (error: AiError) => void
    }
  ): Promise<void> {
    const url = `${baseURL}/1/ai/analyse`
    let fullJson = ''

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        callbacks.onError?.({
          success: false,
          error: errorData?.error || `HTTP ${response.status}`,
          code: response.status,
          type: response.status === 429 ? 'rate_limit' : 'server_error'
        })
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError?.({
          success: false,
          error: '浏览器不支持流式响应',
          type: 'server_error'
        })
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data.trim() === '[DONE]') continue

            try {
              const chunk = JSON.parse(data)
              const content = chunk.choices?.[0]?.delta?.content
              if (content) {
                fullJson += content
                callbacks.onChunk?.(fullJson)
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      try {
        const analysis: AiAnalysisResult = JSON.parse(fullJson)
        callbacks.onDone?.(analysis, false)
      } catch {
        callbacks.onError?.({
          success: false,
          error: 'AI 分析结果解析失败',
          type: 'analysis_failed'
        })
      }
    } catch (e: any) {
      callbacks.onError?.({
        success: false,
        error: e.message || '网络请求失败',
        type: 'server_error'
      })
    }
  }

  /**
   * 提交日志
   */
  async submitLog(params: LogSubmitParams): Promise<LogSubmitResponse> {
    const response = await this.post<LogSubmitResponse>('/1/log', params)
    return response.data
  }

  /**
   * 获取原始日志
   */
  async getRawLog(id: string): Promise<string> {
    const response = await this.get<string>(`/1/raw/${id}`, {
      headers: { Accept: 'text/plain' }
    })
    return response.data
  }

  /**
   * 获取日志洞察
   */
  async getInsights(id: string) {
    const response = await this.get(`/1/insights/${id}`)
    return response.data
  }

  /**
   * 获取 AI 分析结果（兼容缓存直接返回的情况）
   * @deprecated 使用 streamAiAnalysis 替代
   */
  async getAiAnalysis(id: string) {
    const response = await this.get(`/1/ai/${id}`)
    return response.data
  }

  /**
   * 删除日志（支持单个和多个）
   */
  async deleteLog(id: string | string[], token: string): Promise<DeleteResponse> {
    const ids = Array.isArray(id) ? id.join(',') : id
    const response = await this.delete<DeleteResponse>(`/1/delete/${ids}`, {
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
    const response = await this.get<LimitsResponse>('/1/limits')
    return response.data
  }

  /**
   * 获取过滤器信息
   */
  async getFilters(): Promise<FiltersResponse> {
    const response = await this.get<FiltersResponse>('/1/filters')
    return response.data
  }
}

export const apiClient = new ApiClient()

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  return `${baseURL}/${cleanEndpoint}`
}

export default apiClient
