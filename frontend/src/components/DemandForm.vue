<template>
  <el-card class="form-card">
    <template #header>
      <div class="header-row">
        <div>
          <strong>了解你的偏好</strong>
          <p>不用一次说得很复杂，先把最关键的几项偏好告诉我，就能先给你一个大致方向。</p>
        </div>
        <div class="header-chip">Quick profile</div>
      </div>
    </template>

    <el-form :model="localForm" label-width="110px" class="demand-form">
      <div class="form-grid">
        <el-form-item label="客户类型">
          <el-select v-model="localForm.customerType">
            <el-option label="个人客户" value="individual" />
            <el-option label="高净值客户" value="high_net_worth" />
            <el-option label="机构客户" value="institutional" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险偏好">
          <el-select v-model="localForm.riskPreference">
            <el-option label="保守型" value="conservative" />
            <el-option label="稳健型" value="stable" />
            <el-option label="平衡型" value="balanced" />
            <el-option label="进取型" value="aggressive" />
          </el-select>
        </el-form-item>
        <el-form-item label="投资期限">
          <el-select v-model="localForm.investmentHorizon">
            <el-option label="1-3个月" value="1-3m" />
            <el-option label="6-12个月" value="6-12m" />
            <el-option label="1年以上" value="12m_plus" />
          </el-select>
        </el-form-item>
        <el-form-item label="流动性要求">
          <el-select v-model="localForm.liquidityNeed">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="中低" value="medium_low" />
          </el-select>
        </el-form-item>
        <el-form-item label="收益诉求">
          <el-select v-model="localForm.returnGoal">
            <el-option label="稳健保值" value="capital_stability" />
            <el-option label="稳健增厚" value="enhanced_stable" />
            <el-option label="平衡增长" value="balanced_growth" />
            <el-option label="定制需求" value="custom_need" />
          </el-select>
        </el-form-item>
        <el-form-item label="资金规模">
          <el-input-number v-model="localForm.fundSize" :min="0" :step="100000" />
        </el-form-item>
      </div>

      <el-form-item label="当前配置">
        <el-input v-model="localForm.currentAllocation" placeholder="比如：主要在货基、理财、定存等" />
      </el-form-item>
      <el-form-item label="补充描述">
        <el-input v-model="localForm.notes" type="textarea" :rows="5" placeholder="比如：不想回撤太大、这笔钱半年内可能要用、希望收益比现金管理高一些等" />
      </el-form-item>
      <el-form-item class="action-row">
        <el-button type="primary" @click="$emit('submit')">看看适合我的方向</el-button>
        <el-button @click="$emit('reset')">重新填写</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { DemandInput } from '../types/demand'

const props = defineProps<{ modelValue: DemandInput }>()
const emit = defineEmits(['update:modelValue', 'submit', 'reset'])
const localForm = reactive<DemandInput>({ ...props.modelValue })

watch(
  () => localForm,
  (value) => emit('update:modelValue', { ...value }),
  { deep: true }
)

watch(
  () => props.modelValue,
  (value) => Object.assign(localForm, value),
  { deep: true }
)
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
}

.header-row p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.header-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(23, 55, 91, 0.08);
  color: var(--blue);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.action-row :deep(.el-form-item__content) {
  display: flex;
  gap: 10px;
}

@media (max-width: 820px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
