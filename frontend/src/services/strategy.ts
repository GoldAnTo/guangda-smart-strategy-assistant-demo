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
  volatility?: string         // "low" | "medium" | "high" 等文字描述
  volatilityValue?: number    // 具体数值
  sharpe?: number
  startDate?: string
  // 增强字段（来自 strategies-enhanced.json）
  riskLevel?: string
  riskLevelDisplay?: string
  investmentHorizon?: string
  investmentHorizonDisplay?: string
  liquidity?: string
  liquidityDisplay?: string
  returnExpectation?: string
  returnExpectationDisplay?: string
  volatilityDisplay?: string
  minInvestment?: number
  suitableFor?: string[]
  notSuitableFor?: string[]
  matchKeywords?: string[]
  standardRiskNotice?: string
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
  if (d && (d.success === true || d.code === 0) && 'data' in d) {
    return d.data as T
  }
  return responseData as T
}

export async function listStrategies(): Promise<StrategyItem[]> {
  const response = await apiClient.get('/strategies')
  const raw = unwrap<unknown>(response.data)
  // Java API: raw is the array directly; Node.js API: raw is { strategies: [...] }
  if (Array.isArray(raw)) return raw as StrategyItem[]
  const d = raw as Record<string, unknown>
  return Array.isArray(d?.strategies) ? d.strategies as StrategyItem[] : []
}

export async function getStrategy(id: string): Promise<StrategyItem> {
  const response = await apiClient.get(`/strategies/${id}`)
  const raw = unwrap<unknown>(response.data)

  // Case 1: Node.js — { strategy: {...} }
  if (!Array.isArray(raw) && typeof raw === 'object' && raw !== null && 'strategy' in (raw as Record<string, unknown>)) {
    return (raw as Record<string, unknown>).strategy as StrategyItem
  }
  // Case 2: Java API array — [{...}] or wrapped differently
  if (Array.isArray(raw) && (raw as unknown[]).length > 0) {
    const first = (raw as unknown[])[0] as Record<string, unknown>
    // Java sometimes returns {data: [{...}]} and we already unwrapped once
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      // This IS the strategy object
      return first as unknown as StrategyItem
    }
  }
  // Case 3: Java — raw is already the strategy object
  if (!Array.isArray(raw) && typeof raw === 'object' && raw !== null) {
    return raw as StrategyItem
  }
  throw new Error(`无法解析策略数据: ${JSON.stringify(raw).substring(0, 100)}`)
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
