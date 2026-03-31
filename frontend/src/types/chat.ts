import type { CustomerProfile } from './demand'
import type { RecommendationItem } from './recommendation'

export type ChatMode = 'strategy_intro' | 'preference_intake' | 'recommendation_followup'

export interface StrategyContext {
  id: string
  name: string
  productLine: string
  strategy: string
  suitableFor: string[]
  notSuitableFor: string[]
  standardRiskNotice: string
}

export interface ChatContext {
  profile?: CustomerProfile | null
  recommended?: RecommendationItem[]
  riskNotice?: string
  mode?: ChatMode
  selectedStrategy?: StrategyContext | null
}

export interface ChatRequest {
  question: string
  context: ChatContext
}

export interface ChatResponse {
  answer: string
  complianceChecked: boolean
  shouldEscalate: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
