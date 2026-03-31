import { apiClient } from './api'
import type { CustomerProfile } from '../types/demand'
import type { MatchProductsResponse, GenerateExplanationResponse, RecommendationItem, ExcludedItem } from '../types/recommendation'

export async function matchProducts(profile: CustomerProfile) {
  const { data } = await apiClient.post<MatchProductsResponse>('/api/match-products', { profile })
  return data
}

export async function generateExplanation(payload: {
  profile: CustomerProfile
  recommended: RecommendationItem[]
  excluded: ExcludedItem[]
}) {
  const { data } = await apiClient.post<GenerateExplanationResponse>('/api/generate-explanation', payload)
  return data
}
