import axios from 'axios'

export interface ApiEnvelope<T> {
  success?: boolean
  code?: number
  message?: string
  data?: T
  traceId?: string
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003',
  timeout: 30000,
})

apiClient.post = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  axios.post<T>(url, data, { ...apiClient.defaults, ...config })

// Response interceptor: handle error envelopes
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)
