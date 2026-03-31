import { defineStore } from 'pinia'
import type { RecommendationItem, ExcludedItem, ExplanationResult } from '../types/recommendation'

export const useRecommendationStore = defineStore('recommendation', {
  state: () => ({
    recommended: [] as RecommendationItem[],
    excluded: [] as ExcludedItem[],
    explanation: null as ExplanationResult | null,
    shouldEscalate: false,
    escalationType: '',
    escalationReason: '',
    nextAction: ''
  }),
  actions: {
    setMatchResult(payload: {
      recommended: RecommendationItem[]
      excluded: ExcludedItem[]
      shouldEscalate: boolean
      escalationType: string
      escalationReason: string
      nextAction: string
    }) {
      this.recommended = payload.recommended
      this.excluded = payload.excluded
      this.shouldEscalate = payload.shouldEscalate
      this.escalationType = payload.escalationType
      this.escalationReason = payload.escalationReason
      this.nextAction = payload.nextAction
    },
    setExplanation(payload: ExplanationResult) {
      this.explanation = payload
    },
    resetRecommendation() {
      this.recommended = []
      this.excluded = []
      this.explanation = null
      this.shouldEscalate = false
      this.escalationType = ''
      this.escalationReason = ''
      this.nextAction = ''
    }
  }
})
