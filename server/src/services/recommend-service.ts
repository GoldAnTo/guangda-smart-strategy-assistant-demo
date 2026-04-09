import strategiesData from '../data/strategies-enhanced.json'
import rulesData from '../data/recommendation-rules.json'

export interface CustomerProfile {
  riskLevel: string       // conservative | stable | balanced | growth | highRisk
  investmentHorizon: string  // short_term | medium_term | long_term
  liquidityNeed: string    // high | medium | low
  returnExpectation: string  // capital_stability | stable_enhancement | balanced | balanced_growth | growth | absolute_return | alternative_return
  investmentAmount?: number  // 万元，可选
  age?: number             // 可选
}

export interface Strategy {
  id: string
  seed: number
  name: string
  navCategory: string
  category: string
  productType: string
  riskLevel: string
  riskLevelDisplay: string
  investmentHorizon: string
  investmentHorizonDisplay: string
  liquidity: string
  liquidityDisplay: string
  returnExpectation: string
  returnExpectationDisplay: string
  volatility: string
  volatilityDisplay: string
  minInvestment: number
  minInvestmentUnit: string
  owner: string
  logicSummary: string
  benchmarkName: string
  positioning: string
  tags: string[]
  outlookStars: number
  annualReturn: number
  winRate: number
  suitableFor: string[]
  notSuitableFor: string[]
  matchKeywords: string[]
  standardRiskNotice: string
}

export interface ScoreBreakdown {
  riskScore: number
  riskMax: number
  horizonScore: number
  horizonMax: number
  liquidityScore: number
  liquidityMax: number
  returnScore: number
  returnMax: number
  balanceBonus: number
  balanceMax: number
  total: number
  totalMax: number
}

export interface RecommendedStrategy {
  strategy: Strategy
  matchScore: number
  priority: 'primary' | 'alternative' | 'cautionary'
  priorityInfo: {
    icon: string
    label: string
    color: string
    description: string
  }
  scoreBreakdown: ScoreBreakdown
  matchReasons: string[]
  riskMismatches: string[]
  liquidityWarnings: string[]
  aiNarrative?: string
}

export interface RecommendResult {
  profile: CustomerProfile
  profileSummary: string
  recommendations: RecommendedStrategy[]
  primaryCount: number
  alternativeCount: number
  cautionaryCount: number
  shouldEscalate: boolean
  escalationInfo?: {
    escalationType: string
    reason: string
  }
  aiAnalysisSteps?: Array<{ icon: string; text: string; done: boolean }>
}

function calcRiskScore(profile: CustomerProfile, strategy: Strategy): { score: number; max: number; mismatches: string[] } {
  const riskRules = (rulesData.riskMatching as Record<string, any>)[profile.riskLevel]
  if (!riskRules) return { score: 0, max: rulesData.scoreWeights.riskMatch, mismatches: [] }
  const score = riskRules.scoreMap[strategy.riskLevel] ?? 0
  const max = rulesData.scoreWeights.riskMatch
  const mismatches: string[] = []
  if (!riskRules.allowed.includes(strategy.riskLevel)) {
    mismatches.push(`该客户风险偏好（${profile.riskLevel}）与策略风险等级（${strategy.riskLevel}）存在冲突`)
  }
  return { score, max, mismatches }
}

function calcHorizonScore(profile: CustomerProfile, strategy: Strategy): { score: number; max: number } {
  const hRules = (rulesData.horizonMatching as Record<string, any>)[profile.investmentHorizon]
  if (!hRules) return { score: 0, max: rulesData.scoreWeights.horizonMatch }
  const score = hRules.scoreMap[strategy.investmentHorizon] ?? 0
  return { score, max: rulesData.scoreWeights.horizonMatch }
}

function calcLiquidityScore(profile: CustomerProfile, strategy: Strategy): { score: number; max: number; warnings: string[] } {
  const lRules = (rulesData.liquidityMatching as Record<string, any>)[profile.liquidityNeed]
  if (!lRules) return { score: 0, max: rulesData.scoreWeights.liquidityMatch, warnings: [] }
  const score = lRules.scoreMap[strategy.liquidity] ?? 0
  const warnings: string[] = []
  if (lRules.incompatible.includes(strategy.liquidity)) {
    warnings.push(`策略流动性（${strategy.liquidityDisplay}）可能无法满足您的流动性需求`)
  }
  return { score, max: rulesData.scoreWeights.liquidityMatch, warnings }
}

// 中文 productType → 规则引擎英文 key 映射
const productTypeMap: Record<string, string> = {
  '低价转债': 'convertible_bond',
  '成长': 'equity_active',
  '价值': 'equity_value',
  'ETF': 'etf_sector',
  '商品': 'commodity',
  '混合型': 'multi_asset',
  '股指期货': 'derivatives',
  '股基FOF': 'equity_fof',
}

function calcReturnScore(profile: CustomerProfile, strategy: Strategy): { score: number; max: number } {
  const rRules = (rulesData.returnExpectationMatching as Record<string, any>)[profile.returnExpectation]
  if (!rRules) return { score: 0, max: rulesData.scoreWeights.returnExpectationMatch }
  const mapped = productTypeMap[strategy.productType] ?? strategy.productType
  const score = rRules.scoreMap[mapped] ?? 0
  return { score, max: rulesData.scoreWeights.returnExpectationMatch }
}

function calcBalanceBonus(profile: CustomerProfile, strategy: Strategy): { score: number; max: number } {
  const bonus = rulesData.scoreWeights.assetBalanceBonus
  if (strategy.tags.includes('低股债相关性') || strategy.tags.includes('商品')) return { score: bonus, max: bonus }
  const mapped = productTypeMap[strategy.productType] ?? strategy.productType
  if (mapped === 'multi_asset' || mapped === 'commodity' || strategy.tags.includes('低股债相关性')) return { score: bonus, max: bonus }
  return { score: 0, max: bonus }
}

function buildMatchReasons(profile: CustomerProfile, strategy: Strategy, breakdown: ScoreBreakdown): string[] {
  const reasons: string[] = []
  if (breakdown.riskScore >= breakdown.riskMax * 0.8) {
    reasons.push(`风险等级匹配：您的风险偏好与策略的${strategy.riskLevelDisplay}定位高度一致`)
  }
  if (breakdown.horizonScore >= breakdown.horizonMax) {
    reasons.push(`投资期限匹配：策略适合${strategy.investmentHorizonDisplay}，符合您的资金安排`)
  }
  if (breakdown.liquidityScore >= breakdown.liquidityMax * 0.8) {
    reasons.push(`流动性匹配：策略的${strategy.liquidityDisplay}特征满足您的资金使用计划`)
  }
  if (strategy.tags.includes('稳健') || strategy.riskLevel === 'R3' || strategy.riskLevel === 'R2') {
    if (profile.riskLevel === 'conservative' || profile.riskLevel === 'stable') {
      reasons.push(`策略属于${strategy.riskLevelDisplay}产品，适合${strategy.suitableFor[0] || '您的风险偏好'}`)
    }
  }
  if (strategy.outlookStars >= 4) {
    reasons.push(`策略综合评级较高（★${strategy.outlookStars}），历史表现稳健`)
  }
  if (strategy.annualReturn > 10 && breakdown.returnScore >= breakdown.returnMax * 0.5) {
    reasons.push(`策略年化收益（${strategy.annualReturn.toFixed(2)}%）在同类中表现突出`)
  }
  return reasons
}

function getPriority(score: number): 'primary' | 'alternative' | 'cautionary' {
  const t = rulesData.priorityThresholds
  if (score >= t.primary) return 'primary'
  if (score >= t.alternative) return 'alternative'
  return 'cautionary'
}

function getPriorityInfo(priority: 'primary' | 'alternative' | 'cautionary') {
  return rulesData.priorityLabels[priority]
}

function checkEscalation(profile: CustomerProfile): { shouldEscalate: boolean; escalationType?: string; reason?: string } {
  for (const rule of rulesData.escalationRules) {
    let matched = false
    if (rule.condition.includes('investment_amount > 1000') && (profile.investmentAmount || 0) > 1000) matched = true
    if (rule.condition.includes('customer_age < 25') && profile.age != null && profile.age < 25) matched = true
    if (rule.condition.includes('customer_age > 65') && profile.age != null && profile.age > 65) matched = true
    if (rule.condition.includes('risk_level') && rule.condition.includes(profile.riskLevel) && rule.condition.includes('return_expectation') && rule.condition.includes(profile.returnExpectation)) matched = true
    if (matched) return { shouldEscalate: true, escalationType: rule.escalationType, reason: rule.reason }
  }
  return { shouldEscalate: false }
}

function profileSummary(profile: CustomerProfile): string {
  const riskMap: Record<string, string> = { conservative: '保守型', stable: '稳健型', balanced: '平衡型', growth: '成长型', highRisk: '高风险型' }
  const horizonMap: Record<string, string> = { short_term: '短期（半年内）', medium_term: '中期（半年至两年）', long_term: '长期（两年以上）' }
  const liquidityMap: Record<string, string> = { high: '高流动性需求（随时要用）', medium: '中等流动性（3-6个月）', low: '低流动性（一年以上不用）' }
  const returnMap: Record<string, string> = {
    capital_stability: '本金保障优先',
    stable_enhancement: '稳健增值',
    balanced: '收益与风险平衡',
    balanced_growth: '追求稳健成长',
    growth: '追求高收益',
    absolute_return: '追求绝对收益',
    alternative_return: '追求低相关性收益'
  }
  const parts = [
    `风险偏好：${riskMap[profile.riskLevel] || profile.riskLevel}`,
    `投资期限：${horizonMap[profile.investmentHorizon] || profile.investmentHorizon}`,
    `流动性需求：${liquidityMap[profile.liquidityNeed] || profile.liquidityNeed}`,
    `收益目标：${returnMap[profile.returnExpectation] || profile.returnExpectation}`,
  ]
  if (profile.investmentAmount) parts.push(`投资金额：约${profile.investmentAmount}万元`)
  return parts.join('；')
}

export const recommendService = {
  recommend(profile: CustomerProfile): RecommendResult {
    const strategies = (strategiesData as { strategies: Strategy[] }).strategies

    const escalation = checkEscalation(profile)
    if (escalation.shouldEscalate) {
      return {
        profile,
        profileSummary: profileSummary(profile),
        recommendations: [],
        primaryCount: 0,
        alternativeCount: 0,
        cautionaryCount: 0,
        shouldEscalate: true,
        escalationInfo: { escalationType: escalation.escalationType!, reason: escalation.reason! },
        aiAnalysisSteps: []
      }
    }

    const scored: RecommendedStrategy[] = strategies.map(strategy => {
      const riskResult = calcRiskScore(profile, strategy)
      const horizonResult = calcHorizonScore(profile, strategy)
      const liquidityResult = calcLiquidityScore(profile, strategy)
      const returnResult = calcReturnScore(profile, strategy)
      const balanceResult = calcBalanceBonus(profile, strategy)

      const total = riskResult.score + horizonResult.score + liquidityResult.score + returnResult.score + balanceResult.score
      const max = rulesData.scoreWeights.riskMatch + rulesData.scoreWeights.horizonMatch + rulesData.scoreWeights.liquidityMatch + rulesData.scoreWeights.returnExpectationMatch + rulesData.scoreWeights.assetBalanceBonus

      const breakdown: ScoreBreakdown = {
        riskScore: riskResult.score,
        riskMax: rulesData.scoreWeights.riskMatch,
        horizonScore: horizonResult.score,
        horizonMax: rulesData.scoreWeights.horizonMatch,
        liquidityScore: liquidityResult.score,
        liquidityMax: rulesData.scoreWeights.liquidityMatch,
        returnScore: returnResult.score,
        returnMax: rulesData.scoreWeights.returnExpectationMatch,
        balanceBonus: balanceResult.score,
        balanceMax: rulesData.scoreWeights.assetBalanceBonus,
        total,
        totalMax: max
      }

      const matchScore = Math.round((total / max) * 100)
      const priority = getPriority(matchScore)
      const matchReasons = buildMatchReasons(profile, strategy, breakdown)

      return {
        strategy,
        matchScore,
        priority,
        priorityInfo: getPriorityInfo(priority),
        scoreBreakdown: breakdown,
        matchReasons,
        riskMismatches: riskResult.mismatches,
        liquidityWarnings: liquidityResult.warnings,
      }
    })

    // Sort: primary first, then by score
    scored.sort((a, b) => {
      if (a.priority !== b.priority) {
        const order = { primary: 0, alternative: 1, cautionary: 2 }
        return order[a.priority] - order[b.priority]
      }
      return b.matchScore - a.matchScore
    })

    const primaryCount = scored.filter(s => s.priority === 'primary').length
    const alternativeCount = scored.filter(s => s.priority === 'alternative').length
    const cautionaryCount = scored.filter(s => s.priority === 'cautionary').length

    const aiSteps = [
      { icon: '🔍', text: '理解客户需求', done: true },
      { icon: '📊', text: '扫描策略库', done: true },
      { icon: '⚖️', text: '评估风险收益', done: true },
      { icon: '🔬', text: '对比基准表现', done: true },
      { icon: '🧠', text: '综合排名', done: true },
      { icon: '✅', text: '生成推荐', done: true },
    ]

    return {
      profile,
      profileSummary: profileSummary(profile),
      recommendations: scored,
      primaryCount,
      alternativeCount,
      cautionaryCount,
      shouldEscalate: false,
      aiAnalysisSteps: aiSteps
    }
  }
}
