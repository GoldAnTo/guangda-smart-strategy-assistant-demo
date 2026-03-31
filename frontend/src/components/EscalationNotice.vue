<template>
  <el-alert
    type="warning"
    :title="title"
    :description="description"
    :closable="false"
    class="notice"
  />
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped>
.notice {
  margin-top: 16px;
}
</style>
