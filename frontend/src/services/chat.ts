import { apiClient } from './api'
import type { ChatRequest, ChatResponse } from '../types/chat'

export async function sendChat(payload: ChatRequest) {
  const { data } = await apiClient.post<ChatResponse>('/api/chat', payload)
  return data
}
