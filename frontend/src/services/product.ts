import axios from 'axios'

export interface ProductBenchmarkReturns {
  daily: number | null
  weekly: number | null
  monthly: number | null
  quarterly: number | null
  halfYear: number | null
  yearly: number | null
  ytd: number | null
}

export interface ProductBenchmark {
  dataDate: string | null
  netValue: number | null
  navChangeDaily: number | null
  navChangeDailyPct: number | null
  rateBondAllocationPct: number | null
  creditBondAllocationPct: number | null
  duration: number | null
  volatilityAnnual: number | null
  sharpeRatio: number | null
  returns: ProductBenchmarkReturns
}

export interface Product {
  id: string
  name: string
  type: string
  productLine: string
  riskLevel: string
  durationTag: string
  liquidityTag: string
  volatilityTag: string
  targetClients: string[]
  strategy: string
  assetMix: string[]
  returnSources: string[]
  risks: string[]
  suitableFor: string[]
  notSuitableFor: string[]
  recommendTags: string[]
  forbiddenTags: string[]
  standardRiskNotice: string
  standardPitch: string
  benchmark: ProductBenchmark
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003',
  timeout: 30000
})

// 拦截器：解包 { code, data } 信封，code !== 0 时抛错
apiClient.interceptors.response.use((response) => {
  const payload = response.data as ApiEnvelope<unknown>
  if (payload && typeof payload.code === 'number') {
    if (payload.code !== 0) {
      return Promise.reject(new Error(payload.message || 'request failed'))
    }
    response.data = payload.data
  }
  return response
})

export async function getProduct(id: string): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/api/products/${id}`)
  return data
}

export async function listProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>('/api/products')
  if (Array.isArray(data)) return data
  return []
}
