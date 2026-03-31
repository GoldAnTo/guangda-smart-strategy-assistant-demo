import rules from '../data/rules.json'

export const ruleService = {
  checkEscalation(profile: any) {
    if (profile.goalTag === 'custom_need') {
      return {
        shouldEscalate: true,
        escalationType: 'custom_account',
        reason: '客户需求更适合专户/定制服务流程',
        nextAction: '建议转专户服务经理进一步确认客户约束条件与定制需求'
      }
    }

    if (profile.goalTag === 'holding_explanation') {
      return {
        shouldEscalate: true,
        escalationType: 'holding_explanation',
        reason: '当前场景更适合持有中产品解释流程',
        nextAction: '建议由客户经理结合持仓产品与净值波动情况做解释沟通'
      }
    }

    return {
      shouldEscalate: false,
      escalationType: '',
      reason: '',
      nextAction: ''
    }
  },

  checkRisk(profile: any, product: any) {
    const matchedRule = rules.riskRules.find(
      (rule: any) => rule.customerRisk === profile.riskLevel && rule.productRisk === product.riskLevel
    )

    if (!matchedRule) {
      return { allow: true, reason: '' }
    }

    return {
      allow: matchedRule.allow,
      reason: matchedRule.reason || ''
    }
  },

  checkDuration(profile: any, product: any) {
    const matchedRule = rules.durationRules.find((rule: any) => rule.horizonTag === profile.horizonTag)

    if (!matchedRule) {
      return { allow: true, reason: '' }
    }

    const forbidden = matchedRule.forbiddenProductDurationTags.includes(product.durationTag)

    return {
      allow: !forbidden,
      reason: forbidden ? matchedRule.reason : ''
    }
  },

  checkLiquidity(profile: any, product: any) {
    const matchedRule = rules.liquidityRules.find((rule: any) => rule.liquidityNeed === profile.liquidityTag)

    if (!matchedRule) {
      return { allow: true, reason: '' }
    }

    const forbidden = matchedRule.forbiddenProductLiquidityTags.includes(product.liquidityTag)

    return {
      allow: !forbidden,
      reason: forbidden ? matchedRule.reason : ''
    }
  },

  checkChatEscalation(question: string) {
    const sensitiveWords = ['投诉', '保本', '收益保证', '是不是有问题', '亏了怎么办', '直接买哪个', '直接推荐', '拍板', '保证收益']
    const askForFinalDecisionWords = ['适合我买吗', '选哪个', '哪个最好', '直接告诉我买哪个']

    return {
      shouldEscalate:
        sensitiveWords.some((word) => question.includes(word)) ||
        askForFinalDecisionWords.some((word) => question.includes(word))
    }
  }
}
