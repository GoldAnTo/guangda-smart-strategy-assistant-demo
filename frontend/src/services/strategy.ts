import { apiClient } from './api'

export interface StrategyItem {
  name: string
  navCategory: string
  category: string
  tags: string[]
  annualReturn: number
  winRate: number
  outlookStars: number
  structure: string
  owner: string
  logicSummary: string
  benchmarkName: string
  positioning: string
  seed: number
  maxDrawdown?: number
  volatility?: number
  sharpe?: number
  startDate?: string
}

export interface TimeSeriesPoint {
  date: string
  ret: number | null
  benchmark: number | null
}

export interface TimeSeriesResponse {
  strategyId: string
  strategyName: string
  benchmarkName: string
  period: string
  data: TimeSeriesPoint[]
}

function unwrap<T>(responseData: unknown): T {
  const d = responseData as Record<string, unknown>
  if (d && d.success === true && 'data' in d) {
    return d.data as T
  }
  return responseData as T
}

export async function listStrategies(): Promise<StrategyItem[]> {
  const response = await apiClient.get('/strategies')
  const data = unwrap<{ strategies: StrategyItem[] }>(response.data)
  return Array.isArray(data.strategies) ? data.strategies : []
}

export async function getStrategy(id: string): Promise<StrategyItem> {
  const response = await apiClient.get(`/strategies/${id}`)
  const data = unwrap<{ strategy: StrategyItem }>(response.data)
  return data.strategy
}

export async function getStrategyTimeSeries(id: string, period = 'inception'): Promise<TimeSeriesResponse> {
  const response = await apiClient.get(`/strategies/${id}/timeseries?period=${period}`)
  return unwrap<TimeSeriesResponse>(response.data)
}

// Portfolio simulation
export interface Allocation {
  strategyId: string
  weight: number
}

export interface PortfolioComponent {
  strategyId: string
  name: string
  navCategory: string
  weight: number
  annualReturn: number
  volatility: number
  maxDrawdown: number
}

export interface PortfolioResult {
  period: string
  totalWeight: number
  portfolioReturn: number
  portfolioVolatility: number
  portfolioMaxDrawdown: number
  portfolioSharpe: number
  components: PortfolioComponent[]
}

export async function simulatePortfolio(allocations: Allocation[], period = 'inception'): Promise<PortfolioResult> {
  const response = await apiClient.post('/portfolio/simulate', { allocations, period })
  return unwrap<PortfolioResult>(response.data)
}
