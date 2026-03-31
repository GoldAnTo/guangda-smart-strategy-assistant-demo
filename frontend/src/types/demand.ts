export interface DemandInput {
  customerType: string
  riskPreference: string
  investmentHorizon: string
  liquidityNeed: string
  returnGoal: string
  fundSize: number
  currentAllocation: string
  notes: string
}

export interface CustomerProfile {
  customerType: string
  riskLevel: string
  horizonTag: string
  liquidityTag: string
  goalTag: string
  drawdownTolerance: string
  needsFollowUp: boolean
  followUpQuestions: string[]
}

export interface AnalyzeDemandResponse {
  profile: CustomerProfile
}
