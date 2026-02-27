import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

/**
 * API 客户端配置
 * 生产环境：https://api.logshare.cn
 */
const baseURL = 'https://api.logshare.cn'

/**
 * API 客户端类
 * 提供统一的 HTTP 请求方法和错误处理
 */
export class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API 请求错误:', error.response?.status, error.message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }
}

// 导出单例
export const apiClient = new ApiClient()

/**
 * 获取完整 API URL
 * @param endpoint - API 端点路径
 * @returns 完整的 API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  return `${baseURL}/${cleanEndpoint}`
}

export default apiClient
