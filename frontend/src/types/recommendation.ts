export interface BenchmarkReturns {
  daily: number | null
  weekly: number | null
  monthly: number | null
  quarterly: number | null
  halfYear: number | null
  yearly: number | null
  ytd: number | null
}

export interface BenchmarkInfo {
  // 基本信息
  dataDate: string | null
  netValue: number | null
  // 资产配置
  rateBondAllocationPct: number | null   // 利率债占比(%)
  creditBondAllocationPct: number | null  // 信用债占比(%)
  // 风险收益指标
  duration: number | null     // 修正久期(年)
  volatilityAnnual: number | null  // 波动率(%)
  sharpeRatio: number | null  // 夏普比率
  // 收益数据
  returns: BenchmarkReturns
  // 展示用综合字段
  performanceNote?: string
  dataSource?: string
}

export interface ScoreBreakdown {
  riskScore: number
  durationScore: number
  liquidityScore: number
  goalScore: number
  balanceScore: number
}

export interface RecommendationItem {
  // 后端 match.ts 返回的实际结构：recommended 数组里直接是策略对象
  id: number
  name: string
  navCategory: string
  annualReturn: number
  winRate: number
  maxDrawdown: number
  volatilityValue: number
  sharpe: number
  riskLevel: string
  investmentHorizon: string
  liquidityDisplay: string
  returnExpectation: string
  matchScore: number
  priority: 'primary' | 'backup'
  matchReasons: string[]
  benchmark?: BenchmarkInfo | null
}

export interface ExcludedItem {
  productId: string
  productName: string
  excludeReason: string
}

export interface MatchProductsResponse {
  recommended: RecommendationItem[]
  excluded: ExcludedItem[]
  shouldEscalate: boolean
  escalationType: string
  escalationReason: string
  nextAction: string
}

export interface ExplanationResult {
  summary: string
  clientExplanation: string
  internalNotes: string
  riskNotice: string
  whyNot: string[]
}

export interface GenerateExplanationResponse extends ExplanationResult {
}
