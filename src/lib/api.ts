import axios from 'axios'

const baseURL = 'https://api.logshare.cn'

export const apiClient = axios.create({
  baseURL: baseURL
})

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  return `${baseURL}/${cleanEndpoint}`
}
