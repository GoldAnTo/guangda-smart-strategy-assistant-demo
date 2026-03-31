<template>
  <el-card class="score-card">
    <template #header><span>评分拆解</span></template>

    <div class="score-row">
      <span>风险匹配</span>
      <strong>{{ score.riskScore }}/30</strong>
    </div>
    <div class="score-row">
      <span>期限匹配</span>
      <strong>{{ score.durationScore }}/20</strong>
    </div>
    <div class="score-row">
      <span>流动性匹配</span>
      <strong>{{ score.liquidityScore }}/20</strong>
    </div>
    <div class="score-row">
      <span>收益目标匹配</span>
      <strong>{{ score.goalScore }}/20</strong>
    </div>
    <div class="score-row">
      <span>资产平衡</span>
      <strong>{{ score.balanceScore }}/10</strong>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { ScoreBreakdown } from '../types/recommendation'

defineProps<{
  score: ScoreBreakdown
}>()
</script>

<style scoped>
.score-card {
  margin-bottom: 16px;
}
.score-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}
.score-row:last-child {
  border-bottom: none;
}
</style>
