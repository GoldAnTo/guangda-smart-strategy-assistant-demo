export const explanationService = {
  safeParseExplanation(raw: string) {
    try {
      const parsed = JSON.parse(raw)

      return {
        summary: parsed.summary || '',
        clientExplanation: parsed.clientExplanation || '',
        internalNotes: parsed.internalNotes || '',
        riskNotice: parsed.riskNotice || '相关产品不保证收益，净值可能随市场变化出现波动。',
        whyNot: Array.isArray(parsed.whyNot) ? parsed.whyNot : []
      }
    } catch {
      return {
        summary: '',
        clientExplanation: '',
        internalNotes: '',
        riskNotice: '相关产品不保证收益，净值可能随市场变化出现波动。',
        whyNot: []
      }
    }
  }
}
