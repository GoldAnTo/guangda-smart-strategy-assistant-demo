import { defineStore } from 'pinia'
import type { DemandInput, CustomerProfile } from '../types/demand'

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
    } as DemandInput,
    profile: null as CustomerProfile | null
  }),
  actions: {
    setForm(payload: Partial<DemandInput>) {
      this.form = { ...this.form, ...payload }
    },
    setProfile(profile: CustomerProfile) {
      this.profile = profile
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
      }
      this.profile = null
    }
  }
})
