import { apiClient } from './api'
import type {
  ExtractPreferenceRequest,
  ExtractPreferenceResponse,
  ProductAiBriefRequest,
  ProductAiBriefResponse
} from '../types/ai'

export async function getProductAiBrief(payload: ProductAiBriefRequest) {
  const { data } = await apiClient.post<ProductAiBriefResponse>('/api/product-ai-brief', payload)
  return data
}

export async function extractPreference(payload: ExtractPreferenceRequest) {
  const { data } = await apiClient.post<ExtractPreferenceResponse>('/api/extract-preference', payload)
  return data
}
