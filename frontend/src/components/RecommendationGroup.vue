<template>
  <el-card class="group-card">
    <template #header>
      <div class="group-header">
        <span>{{ title }}</span>
        <el-tag v-if="tag" :type="tagType || 'info'">{{ tag }}</el-tag>
      </div>
    </template>

    <div v-if="items.length">
      <RecommendationCard
        v-for="item in items"
        :key="item.productId"
        :item="item"
        :risk-notice="riskNotice"
      />
    </div>

    <el-empty v-else :description="emptyText || '当前暂无内容'" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import RecommendationCard from './RecommendationCard.vue'
import type { RecommendationItem } from '../types/recommendation'

defineProps<{
  title: string
  items: RecommendationItem[]
  riskNotice?: string
  tag?: string
  tagType?: 'success' | 'info' | 'warning' | 'danger' | 'primary'
  emptyText?: string
}>()
</script>

<style scoped>
.group-card {
  margin-bottom: 16px;
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
</style>
