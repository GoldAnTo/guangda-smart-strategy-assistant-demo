export interface ProductAiBriefRequest {
  productName: string
  issuer?: string
  productType?: string
  riskLevel?: string
  investmentTerm?: string
  liquidity?: string
  targetCustomer?: string
  strategy?: string
  assetAllocation?: string
  benchmark?: string
  feeInfo?: string
  highlightTags?: string[]
  importantNotes?: string
  updatedAt?: string
  version?: string
}

export interface ProductAiBriefResponse {
  summary: string
  suitableClientView: string
  keyAttractions: string[]
  watchPoints: string[]
  comparisonHint: string[]
}

export interface ExtractPreferenceProfileDraft {
  riskTolerance: string
  investmentHorizon: string
  liquidityNeed: string
  returnExpectation: string
  drawdownSensitivity: string
  allocationPurpose: string
  specialConstraints: string[]
}

export interface ExtractPreferenceRequestMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface ExtractPreferenceRequest {
  customerId?: string
  customerAgeRange?: string
  aumLevel?: string
  existingRiskLevel?: string
  conversationText?: string
  messages?: ExtractPreferenceRequestMessage[]
  currentProfileDraft?: ExtractPreferenceProfileDraft
  latestMessages?: ExtractPreferenceRequestMessage[]
}

export interface ExtractPreferenceResponse {
  customerProfileDraft: ExtractPreferenceProfileDraft
  missingFields: string[]
  confidence: number
  nextQuestions: string[]
}
