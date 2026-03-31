import { defineStore } from 'pinia';
export const useChatStore = defineStore('chat', {
    state: () => ({
        messages: [],
        shouldEscalate: false,
        mode: 'preference_intake',
        selectedStrategy: null
    }),
    actions: {
        addUserMessage(content) {
            this.messages.push({ role: 'user', content });
        },
        addAssistantMessage(content) {
            this.messages.push({ role: 'assistant', content });
        },
        setEscalation(flag) {
            this.shouldEscalate = flag;
        },
        setMode(mode) {
            this.mode = mode;
        },
        setSelectedStrategy(strategy) {
            this.selectedStrategy = strategy;
        },
        seedAssistantMessage(content) {
            this.messages = [{ role: 'assistant', content }];
        },
        setMessages(messages) {
            this.messages = messages;
        },
        resetChat() {
            this.messages = [];
            this.shouldEscalate = false;
            this.mode = 'preference_intake';
            this.selectedStrategy = null;
        }
    }
});
