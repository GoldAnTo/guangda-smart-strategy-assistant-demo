import { defineStore } from 'pinia'
import type { ChatMessage, ChatMode, StrategyContext } from '../types/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as ChatMessage[],
    shouldEscalate: false,
    mode: 'preference_intake' as ChatMode,
    selectedStrategy: null as StrategyContext | null
  }),
  actions: {
    addUserMessage(content: string) {
      this.messages.push({ role: 'user', content })
    },
    addAssistantMessage(content: string) {
      this.messages.push({ role: 'assistant', content })
    },
    setEscalation(flag: boolean) {
      this.shouldEscalate = flag
    },
    setMode(mode: ChatMode) {
      this.mode = mode
    },
    setSelectedStrategy(strategy: StrategyContext | null) {
      this.selectedStrategy = strategy
    },
    seedAssistantMessage(content: string) {
      this.messages = [{ role: 'assistant', content }]
    },
    setMessages(messages: ChatMessage[]) {
      this.messages = messages
    },
    resetChat() {
      this.messages = []
      this.shouldEscalate = false
      this.mode = 'preference_intake'
      this.selectedStrategy = null
    }
  }
})
