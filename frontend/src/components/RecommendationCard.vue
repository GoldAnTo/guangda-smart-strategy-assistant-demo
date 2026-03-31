<template>
  <el-card shadow="hover" class="card">
    <div class="top-row">
      <div>
        <h3>{{ item.productName }}</h3>
        <div class="subtitle">这类方向为什么值得你先看，可以先从这里理解。</div>
      </div>
      <div class="top-tags">
        <el-tag :type="item.priority === 'primary' ? 'success' : 'info'">
          {{ item.priority === 'primary' ? '更适合优先关注' : '可以作为备选了解' }}
        </el-tag>
      </div>
    </div>

    <div class="section reason-block">
      <div class="title">更贴近你的原因</div>
      <div class="reason-tags">
        <el-tag v-for="reason in item.matchReasons" :key="reason" class="mr">{{ reason }}</el-tag>
      </div>
    </div>

    <div v-if="item.benchmark" class="section benchmark-box">
      <div class="title">产品参考信息</div>
      <div class="benchmark-grid">
        <div v-if="item.benchmark.netValue">
          <span>最新净值</span>
          <strong>{{ item.benchmark.netValue.toFixed(4) }}</strong>
        </div>
        <div v-if="item.benchmark.rateBondAllocationPct">
          <span>利率债占比</span>
          <strong>{{ item.benchmark.rateBondAllocationPct.toFixed(1) }}%</strong>
        </div>
        <div v-if="item.benchmark.creditBondAllocationPct">
          <span>信用债占比</span>
          <strong>{{ item.benchmark.creditBondAllocationPct.toFixed(1) }}%</strong>
        </div>
        <div v-if="item.benchmark.duration">
          <span>修正久期</span>
          <strong>{{ item.benchmark.duration.toFixed(2) }}年</strong>
        </div>
        <div v-if="item.benchmark.volatilityAnnual">
          <span>年化波动率</span>
          <strong>{{ item.benchmark.volatilityAnnual.toFixed(2) }}%</strong>
        </div>
        <div v-if="item.benchmark.sharpeRatio">
          <span>夏普比率</span>
          <strong>{{ item.benchmark.sharpeRatio.toFixed(3) }}</strong>
        </div>
      </div>

      <div v-if="hasAnyReturn" class="return-table">
        <div class="return-row">
          <span class="return-label">近期收益</span>
          <span v-if="item.benchmark.returns?.daily !== null" class="return-item">
            近一日：<strong :class="getReturnClass(item.benchmark.returns.daily)">{{ formatPct(item.benchmark.returns.daily) }}</strong>
          </span>
          <span v-if="item.benchmark.returns?.weekly !== null" class="return-item">
            近一周：<strong :class="getReturnClass(item.benchmark.returns.weekly)">{{ formatPct(item.benchmark.returns.weekly) }}</strong>
          </span>
          <span v-if="item.benchmark.returns?.monthly !== null" class="return-item">
            近一月：<strong :class="getReturnClass(item.benchmark.returns.monthly)">{{ formatPct(item.benchmark.returns.monthly) }}</strong>
          </span>
          <span v-if="item.benchmark.returns?.quarterly !== null" class="return-item">
            近三月：<strong :class="getReturnClass(item.benchmark.returns.quarterly)">{{ formatPct(item.benchmark.returns.quarterly) }}</strong>
          </span>
          <span v-if="item.benchmark.returns?.halfYear !== null" class="return-item">
            近六月：<strong :class="getReturnClass(item.benchmark.returns.halfYear)">{{ formatPct(item.benchmark.returns.halfYear) }}</strong>
          </span>
          <span v-if="item.benchmark.returns?.yearly !== null" class="return-item">
            近一年：<strong :class="getReturnClass(item.benchmark.returns.yearly)">{{ formatPct(item.benchmark.returns.yearly) }}</strong>
          </span>
          <span v-if="item.benchmark.returns?.ytd !== null" class="return-item">
            今年以来：<strong :class="getReturnClass(item.benchmark.returns.ytd)">{{ formatPct(item.benchmark.returns.ytd) }}</strong>
          </span>
        </div>
      </div>

      <p v-if="item.benchmark.performanceNote" class="benchmark-note">{{ item.benchmark.performanceNote }}</p>
      <div v-if="item.benchmark.dataDate" class="data-meta">
        <div>数据截至：{{ item.benchmark.dataDate }}</div>
        <div v-if="item.benchmark.dataSource">数据来源：{{ item.benchmark.dataSource }}</div>
      </div>
    </div>

    <div v-if="riskNotice" class="section risk-box">
      <div class="title">你还要留意的点</div>
      <p>{{ riskNotice }}</p>
    </div>

    <div class="section action-row">
      <el-button type="primary" plain @click="goDetail">查看产品详情</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { RecommendationItem } from '../types/recommendation'
const props = defineProps<{ item: RecommendationItem; riskNotice?: string }>()
const router = useRouter()
function goDetail() { router.push(`/product/${props.item.productId}`) }

function formatPct(v: number | null): string {
  if (v === null || v === undefined) return '-'
  const pct = v * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

function getReturnClass(v: number | null): string {
  if (v === null || v === undefined) return ''
  return v >= 0 ? 'text-green' : 'text-red'
}

const hasAnyReturn = computed(() => {
  const r = props.item.benchmark?.returns
  if (!r) return false
  return [r.daily, r.weekly, r.monthly, r.quarterly, r.halfYear, r.yearly, r.ytd].some(v => v !== null)
})

import { computed } from 'vue'
</script>

<style scoped>
.card {
  margin-bottom: 16px;
}

.top-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.top-row h3 {
  margin: 0;
  font-size: 26px;
}

.subtitle {
  margin-top: 8px;
  color: var(--muted);
  line-height: 1.7;
}

.top-tags {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.section {
  margin-top: 18px;
}

.title {
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--blue);
}

.reason-block {
  padding-top: 8px;
  border-top: 1px solid var(--line);
}

.reason-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mr {
  margin-right: 0;
}

.benchmark-box,
.risk-box {
  padding: 16px;
  border-radius: 18px;
}

.benchmark-box {
  background: rgba(23, 55, 91, 0.05);
}

.benchmark-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.benchmark-grid div {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
}

.benchmark-grid span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 8px;
}

.benchmark-grid strong {
  color: var(--blue);
}

.benchmark-note {
  margin: 12px 0 0;
  color: var(--muted);
  line-height: 1.8;
}

.data-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--muted);
  line-height: 1.9;
}

.return-table {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
}

.return-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}

.return-label {
  font-size: 12px;
  color: var(--muted);
  min-width: 56px;
}

.return-item {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.text-green { color: #67c23a !important; }
.text-red { color: #f56c6c !important; }

.risk-box {
  background: rgba(229, 163, 71, 0.12);
}

.risk-box p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  margin-top: 12px;
}
</style>
