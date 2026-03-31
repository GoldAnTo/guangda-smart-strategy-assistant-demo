import { defineStore } from 'pinia';
export const useDemandStore = defineStore('demand', {
    state: () => ({
        form: {
            customerType: '',
            riskPreference: '',
            investmentHorizon: '',
            liquidityNeed: '',
            returnGoal: '',
            fundSize: 0,
            currentAllocation: '',
            notes: ''
        },
        profile: null
    }),
    actions: {
        setForm(payload) {
            this.form = { ...this.form, ...payload };
        },
        setProfile(profile) {
            this.profile = profile;
        },
        resetDemand() {
            this.form = {
                customerType: '',
                riskPreference: '',
                investmentHorizon: '',
                liquidityNeed: '',
                returnGoal: '',
                fundSize: 0,
                currentAllocation: '',
                notes: ''
            };
            this.profile = null;
        }
    }
});
