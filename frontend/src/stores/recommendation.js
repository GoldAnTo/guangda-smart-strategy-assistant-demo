import { defineStore } from 'pinia';
export const useRecommendationStore = defineStore('recommendation', {
    state: () => ({
        recommended: [],
        excluded: [],
        explanation: null,
        shouldEscalate: false,
        escalationReason: ''
    }),
    actions: {
        setMatchResult(payload) {
            this.recommended = payload.recommended;
            this.excluded = payload.excluded;
            this.shouldEscalate = payload.shouldEscalate;
            this.escalationReason = payload.escalationReason;
        },
        setExplanation(payload) {
            this.explanation = payload;
        },
        resetRecommendation() {
            this.recommended = [];
            this.excluded = [];
            this.explanation = null;
            this.shouldEscalate = false;
            this.escalationReason = '';
        }
    }
});
