import { ruleService } from './rule-service'

function calculateScoreBreakdown(profile: any, product: any) {
  const riskScore =
    profile.riskLevel === 'stable' && product.riskLevel === 'R2'
      ? 30
      : profile.riskLevel === 'conservative' && product.riskLevel === 'R1'
        ? 30
        : product.targetClients?.includes(profile.riskLevel)
          ? 20
          : 10

  const durationScore = product.durationTag === profile.horizonTag ? 20 : 10

  const liquidityScore = product.liquidityTag === profile.liquidityTag ? 20 : 10

  const goalScore =
    profile.goalTag === 'stable_enhancement' && product.type === 'fixed_income_plus'
      ? 20
      : profile.goalTag === 'capital_stability' && product.type === 'cash_enhancement'
        ? 20
        : profile.goalTag === 'portfolio_balance' && product.type === 'pure_bond'
          ? 18
          : 12

  const balanceScore = profile.goalTag === 'portfolio_balance' ? 10 : 5

  return {
    riskScore,
    durationScore,
    liquidityScore,
    goalScore,
    balanceScore
  }
}

function calculateMatchScore(profile: any, product: any) {
  const breakdown = calculateScoreBreakdown(profile, product)
  return Math.min(
    breakdown.riskScore +
      breakdown.durationScore +
      breakdown.liquidityScore +
      breakdown.goalScore +
      breakdown.balanceScore,
    100
  )
}

function getMatchReasons(profile: any, product: any) {
  const reasons: string[] = []

  if (product.durationTag === profile.horizonTag) reasons.push('期限匹配')
  if (product.liquidityTag === profile.liquidityTag) reasons.push('流动性要求匹配')
  if (profile.goalTag === 'stable_enhancement' && product.type === 'fixed_income_plus') {
    reasons.push('稳健增厚目标匹配')
  }
  if (profile.riskLevel === 'stable' && product.riskLevel === 'R2') reasons.push('风险偏好匹配')

  return reasons
}

function getExcludeReason(...checks: Array<{ allow: boolean; reason: string }>) {
  const failed = checks.find((item) => !item.allow)
  return failed?.reason || '不满足当前匹配条件'
}

export const matchService = {
  matchProducts(profile: any, products: any[]) {
    const recommended: any[] = []
    const excluded: any[] = []

    for (const product of products) {
      if (product.type === 'custom_account' && profile.goalTag !== 'custom_need') {
        excluded.push({
          productId: product.id,
          productName: product.name,
          excludeReason: '当前客户需求优先匹配标准化产品'
        })
        continue
      }

      const riskCheck = ruleService.checkRisk(profile, product)
      const durationCheck = ruleService.checkDuration(profile, product)
      const liquidityCheck = ruleService.checkLiquidity(profile, product)

      if (!riskCheck.allow || !durationCheck.allow || !liquidityCheck.allow) {
        excluded.push({
          productId: product.id,
          productName: product.name,
          excludeReason: getExcludeReason(riskCheck, durationCheck, liquidityCheck)
        })
        continue
      }

      const scoreBreakdown = calculateScoreBreakdown(profile, product)
      const matchScore = calculateMatchScore(profile, product)
      const priority = matchScore >= 90 ? 'primary' : 'backup'

      recommended.push({
        productId: product.id,
        productName: product.name,
        matchScore,
        scoreBreakdown,
        priority,
        matchReasons: getMatchReasons(profile, product),
        benchmark: product.benchmark || null
      })
    }

    recommended.sort((a, b) => b.matchScore - a.matchScore)

    return {
      recommended: recommended.slice(0, 3),
      excluded
    }
  }
}
