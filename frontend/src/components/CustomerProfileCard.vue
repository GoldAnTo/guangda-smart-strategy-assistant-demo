<template>
  <el-card class="profile-card">
    <template #header>
      <div class="profile-header">
        <div>
          <strong>客户画像摘要</strong>
          <p>当前匹配结果将以这些画像标签作为基础判断输入。</p>
        </div>
        <div class="profile-badge">Profile Snapshot</div>
      </div>
    </template>

    <div class="grid">
      <div class="profile-item">
        <span class="label">客户类型</span>
        <el-tag>{{ labelOf(customerTypeLabels, profile.customerType) }}</el-tag>
      </div>
      <div class="profile-item">
        <span class="label">风险等级</span>
        <el-tag type="success">{{ labelOf(riskLevelLabels, profile.riskLevel) }}</el-tag>
      </div>
      <div class="profile-item">
        <span class="label">投资期限</span>
        <el-tag type="warning">{{ labelOf(horizonLabels, profile.horizonTag) }}</el-tag>
      </div>
      <div class="profile-item">
        <span class="label">流动性要求</span>
        <el-tag type="info">{{ labelOf(liquidityLabels, profile.liquidityTag) }}</el-tag>
      </div>
      <div class="profile-item">
        <span class="label">收益目标</span>
        <el-tag type="primary">{{ labelOf(goalLabels, profile.goalTag) }}</el-tag>
      </div>
      <div class="profile-item">
        <span class="label">回撤容忍</span>
        <el-tag type="danger">{{ labelOf(drawdownLabels, profile.drawdownTolerance) }}</el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { CustomerProfile } from '../types/demand'
import { customerTypeLabels, drawdownLabels, goalLabels, horizonLabels, labelOf, liquidityLabels, riskLevelLabels } from '../utils/labels'

defineProps<{ profile: CustomerProfile }>()
</script>

<style scoped>
.profile-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}
.profile-header p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.7;
}
.profile-badge {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(167, 123, 50, 0.12);
  color: var(--gold);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.profile-item {
  padding: 14px;
  border-radius: 16px;
  background: rgba(23, 55, 91, 0.05);
}
.label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
