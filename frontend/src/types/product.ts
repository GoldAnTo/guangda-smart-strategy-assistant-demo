export interface ProductItem {
  id: string
  name: string
  type: string
  productLine: string
  riskLevel: string
  durationTag: string
  liquidityTag: string
  volatilityTag: string
  targetClients: string[]
  strategy: string
  assetMix: string[]
  returnSources: string[]
  risks: string[]
  suitableFor: string[]
  notSuitableFor: string[]
  recommendTags: string[]
  forbiddenTags: string[]
  standardRiskNotice: string
  standardPitch: string
}
