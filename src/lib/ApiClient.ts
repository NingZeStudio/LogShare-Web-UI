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

export interface BulkDeleteItem {
  id: string
  token: string
}

export interface BulkDeleteResponse {
  success: boolean
  results: Record<string, {
    success: boolean
    error?: string
    code?: number
  }>
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

export class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      },
      withCredentials: false
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
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

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
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

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
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
      headers: { 'Accept': 'text/plain' }
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
   * 删除日志（支持单个和多个）
   */
  async deleteLog(id: string | string[], token: string): Promise<DeleteResponse> {
    const ids = Array.isArray(id) ? id.join(',') : id
    const response = await this.delete<DeleteResponse>(`/1/delete/${ids}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    return response.data
  }

  /**
   * 批量删除日志
   */
  async bulkDelete(logs: BulkDeleteItem[]): Promise<BulkDeleteResponse> {
    const response = await this.post<BulkDeleteResponse>('/1/bulk/log/delete', logs)
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
