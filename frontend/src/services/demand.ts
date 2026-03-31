import { apiClient } from './api'
import type { DemandInput, AnalyzeDemandResponse } from '../types/demand'

export async function analyzeDemand(payload: DemandInput) {
  const { data } = await apiClient.post<AnalyzeDemandResponse>('/api/analyze-demand', payload)
  return data
}
