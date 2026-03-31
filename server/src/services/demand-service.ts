export function safeParseProfile(raw: string) {
  try {
    const parsed = JSON.parse(raw)

    return {
      customerType: parsed.customerType || 'individual',
      riskLevel: parsed.riskLevel || 'stable',
      horizonTag: parsed.horizonTag || 'mid_term',
      liquidityTag: parsed.liquidityTag || 'medium',
      goalTag: parsed.goalTag || 'stable_enhancement',
      drawdownTolerance: parsed.drawdownTolerance || 'low',
      needsFollowUp: Boolean(parsed.needsFollowUp),
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : []
    }
  } catch {
    return {
      customerType: 'individual',
      riskLevel: 'stable',
      horizonTag: 'mid_term',
      liquidityTag: 'medium',
      goalTag: 'stable_enhancement',
      drawdownTolerance: 'low',
      needsFollowUp: false,
      followUpQuestions: []
    }
  }
}
