const forbiddenWords = ['保本', '稳赚', '确定收益', '不会亏', '几乎没风险']

function stripForbiddenWords(text: string) {
  let result = text || ''
  for (const word of forbiddenWords) {
    result = result.replaceAll(word, '')
  }
  return result
}

export const complianceService = {
  cleanExplanation(explanation: any) {
    return {
      summary: stripForbiddenWords(explanation.summary),
      clientExplanation: stripForbiddenWords(explanation.clientExplanation),
      internalNotes: stripForbiddenWords(explanation.internalNotes),
      riskNotice: stripForbiddenWords(explanation.riskNotice) || '相关产品不保证收益，净值可能随市场变化出现波动。',
      whyNot: Array.isArray(explanation.whyNot)
        ? explanation.whyNot.map((item: string) => stripForbiddenWords(item))
        : []
    }
  },

  cleanChatAnswer(answer: string) {
    const cleaned = stripForbiddenWords(answer)
    return cleaned || '建议结合客户具体情况进一步确认。'
  }
}
