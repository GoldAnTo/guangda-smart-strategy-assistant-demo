<template>
  <el-card class="basis-card">
    <template #header><span>推荐依据</span></template>

    <div class="basis-list">
      <div class="basis-item">
        <strong>客户画像依据</strong>
        <span>{{ riskLevel }} / {{ horizonTag }} / {{ liquidityTag }} / {{ goalTag }}</span>
      </div>
      <div class="basis-item">
        <strong>优先方案依据</strong>
        <span>优先展示规则命中更多、适配得分更高且解释更稳定的候选方向。</span>
      </div>
      <div class="basis-item">
        <strong>暂不推荐依据</strong>
        <span>对风险收益特征不优先、或与当前诉求不完全一致的方向先做保留。</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  riskLevel: string
  horizonTag: string
  liquidityTag: string
  goalTag: string
}>()
</script>

<style scoped>
.basis-card {
  margin-bottom: 16px;
}

.basis-list {
  display: grid;
  gap: 10px;
}

.basis-item {
  padding: 14px;
  border-radius: 14px;
  background: rgba(23, 55, 91, 0.05);
}

.basis-item strong {
  display: block;
  margin-bottom: 6px;
  color: var(--blue);
}

.basis-item span {
  color: var(--muted);
  line-height: 1.8;
}
</style>
