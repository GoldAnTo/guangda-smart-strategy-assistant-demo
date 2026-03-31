<template>
  <div class="page-shell compare-page">

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 顶部标题 -->
    <!-- ═══════════════════════════════════════════════ -->
    <header class="compare-header">
      <div>
        <div class="eyebrow">Strategy comparison</div>
        <h1>方向对比</h1>
        <p class="page-lead">从左侧选择策略添加对比，右侧自动展示对比结果。</p>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 主内容：左侧选策略 + 右侧对比结果 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="compare-layout">

      <!-- 左侧：策略选择面板 -->
      <aside class="selector-panel card">
        <div class="panel-head">
          <div class="section-eyebrow">All strategies</div>
          <div class="panel-count">{{ allStrategies.length }} 条策略</div>
        </div>

        <!-- 搜索 -->
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="searchText" class="search-input" placeholder="搜索策略名称..." />
        </div>

        <!-- 分类过滤 -->
        <div class="cat-filter">
          <button
            v-for="cat in categories"
            :key="cat.name"
            class="cat-btn"
            :class="{ active: activeCat === cat.name }"
            @click="activeCat = activeCat === cat.name ? '' : cat.name"
          >
            {{ cat.name }} <span class="cat-num">{{ cat.count }}</span>
          </button>
        </div>

        <!-- 策略列表 -->
        <div class="pick-list">
          <button
            v-for="s in filteredStrategies"
            :key="s.seed"
            class="pick-row"
            :class="{ active: selectedIds.includes(s.seed) }"
            @click="toggleStrategy(s.seed)"
          >
            <div class="pick-left">
              <div class="pick-check">
                <svg v-if="selectedIds.includes(s.seed)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="pick-info">
                <div class="pick-name">{{ s.name }}</div>
                <div class="pick-cat">{{ s.navCategory }}</div>
              </div>
            </div>
            <div class="pick-metric">
              <div class="pick-ret" :class="s.annualReturn >= 0 ? 'gain' : 'loss'">
                {{ fmt(s.annualReturn) }}%
              </div>
              <div class="pick-sub">年化收益</div>
            </div>
          </button>
        </div>
      </aside>

      <!-- 右侧：对比结果 -->
      <div class="result-area">

        <!-- 空状态 -->
        <div v-if="selectedIds.length === 0" class="empty-state card">
          <div class="empty-icon">📊</div>
          <div class="empty-title">从左侧选择策略开始对比</div>
          <div class="empty-sub">点击策略卡片即可添加，每边至少选 2 条</div>
        </div>

        <!-- 已选策略标签 -->
        <div v-else-if="selectedIds.length === 1" class="one-selected card">
          <div class="section-eyebrow">Selected</div>
          <div class="selected-chips">
            <div v-for="id in selectedIds" :key="id" class="selected-chip">
              <span class="chip-name">{{ getStrategy(id)?.name }}</span>
              <button class="chip-remove" @click="toggleStrategy(id)">×</button>
            </div>
          </div>
          <div class="one-hint">再选至少一条策略即可查看对比</div>
        </div>

        <!-- 对比结果（2条及以上） -->
        <template v-else>
          <!-- 已选策略标签栏 -->
          <div class="selected-bar card">
            <div class="section-eyebrow">Comparing</div>
            <div class="selected-chips">
              <div v-for="id in selectedIds" :key="id" class="selected-chip" :style="{ borderColor: getStrategyColor(id) }">
                <div class="chip-dot" :style="{ background: getStrategyColor(id) }"></div>
                <span class="chip-name">{{ getStrategy(id)?.name }}</span>
                <button class="chip-remove" @click="toggleStrategy(id)">×</button>
              </div>
            </div>
          </div>

          <!-- 核心指标对比 -->
          <section class="result-section card">
            <div class="section-eyebrow">Key metrics</div>
            <h2 class="section-heading">核心指标对比</h2>
            <div class="compare-table">
              <div class="ct-head" :style="gridStyle">
                <div class="ct-cell col-metric">指标</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat">
                  <div class="strat-dot" :style="{ background: getStrategyColor(id) }"></div>
                  <div>
                    <div class="strat-name">{{ getStrategy(id)?.name }}</div>
                    <div class="strat-cat">{{ getStrategy(id)?.navCategory }}</div>
                  </div>
                </div>
              </div>
              <div class="ct-row" :style="gridStyle">
                <div class="ct-cell col-metric muted">年化收益</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat">
                  <span class="ct-val bold" :class="(getStrategy(id)?.annualReturn ?? 0) >= 0 ? 'gain' : 'loss'">
                    {{ fmt(getStrategy(id)?.annualReturn) }}%
                  </span>
                </div>
              </div>
              <div class="ct-row" :style="gridStyle">
                <div class="ct-cell col-metric muted">年度胜率</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat">
                  <span class="ct-val" :class="winRateClass(getStrategy(id)?.winRate ?? 0)">
                    {{ fmt(getStrategy(id)?.winRate, 1, false) }}%
                  </span>
                </div>
              </div>
              <div class="ct-row" :style="gridStyle">
                <div class="ct-cell col-metric muted">最大回撤</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat">
                  <span class="ct-val loss">-{{ fmt(getStrategy(id)?.maxDrawdown, 2, false) }}%</span>
                </div>
              </div>
              <div class="ct-row" :style="gridStyle">
                <div class="ct-cell col-metric muted">年化波动</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat">
                  <span class="ct-val">{{ fmt(getStrategy(id)?.volatilityValue, 2, false) }}%</span>
                </div>
              </div>
              <div class="ct-row" :style="gridStyle">
                <div class="ct-cell col-metric muted">卡玛比率</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat">
                  <span class="ct-val" :class="(getStrategy(id)?.sharpe ?? 0) > 1 ? 'gain' : ''">
                    {{ fmt(getStrategy(id)?.sharpe, 2, false) }}
                  </span>
                </div>
              </div>
              <div class="ct-row" :style="gridStyle">
                <div class="ct-cell col-metric muted">比较基准</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat muted">{{ getStrategy(id)?.benchmarkName || '—' }}</div>
              </div>
              <div class="ct-row" :style="gridStyle">
                <div class="ct-cell col-metric muted">成立时间</div>
                <div v-for="id in selectedIds" :key="id" class="ct-cell col-strat muted">{{ getStrategy(id)?.startDate || '—' }}</div>
              </div>
            </div>
          </section>

          <!-- 收益曲线对比 -->
          <section class="result-section card">
            <div class="chart-toolbar">
              <div>
                <div class="section-eyebrow">Historical performance</div>
                <h2 class="section-heading">历史收益曲线</h2>
              </div>
              <div class="period-tabs">
                <button v-for="p in periods" :key="p.key"
                  class="period-tab" :class="{ active: activePeriod === p.key }"
                  @click="switchPeriod(p.key)">{{ p.label }}</button>
              </div>
            </div>

            <!-- 每条策略迷你指标条 -->
            <div class="mkpi-list">
              <div v-for="id in selectedIds" :key="id" class="mkpi-row">
                <div class="mkpi-label">
                  <div class="mkpi-dot" :style="{ background: getStrategyColor(id) }"></div>
                  <span class="mkpi-name">{{ getStrategy(id)?.name }}</span>
                </div>
                <div class="mkpi-bars">
                  <div class="mkpi-bar-item">
                    <span class="mkpi-bar-label">收益</span>
                    <div class="mkpi-bar-track">
                      <div class="mkpi-bar-fill gain" :style="{ width: Math.min(Math.abs(getStrategy(id)?.annualReturn ?? 0) / maxAnnReturn * 100, 100) + '%' }"></div>
                    </div>
                    <span class="mkpi-val gain">{{ fmt(getStrategy(id)?.annualReturn, 1) }}%</span>
                  </div>
                  <div class="mkpi-bar-item">
                    <span class="mkpi-bar-label">回撤</span>
                    <div class="mkpi-bar-track">
                      <div class="mkpi-bar-fill loss" :style="{ width: Math.min((getStrategy(id)?.maxDrawdown ?? 0) / maxDrawdown * 100, 100) + '%' }"></div>
                    </div>
                    <span class="mkpi-val loss">-{{ fmt(getStrategy(id)?.maxDrawdown, 1, false) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div ref="chartRef" class="compare-chart"></div>
            <div class="chart-legend">
              <div v-for="id in selectedIds" :key="id" class="legend-item">
                <div class="legend-line" :style="{ background: getStrategyColor(id) }"></div>
                <span>{{ getStrategy(id)?.name }}</span>
              </div>
            </div>
          </section>

          <!-- 策略逻辑 -->
          <section class="result-section card">
            <div class="section-eyebrow">Core logic</div>
            <h2 class="section-heading">策略逻辑对比</h2>
            <div class="logic-grid" :style="{ gridTemplateColumns: `repeat(${selectedIds.length}, 1fr)` }">
              <div v-for="id in selectedIds" :key="id" class="logic-item">
                <div class="logic-header">
                  <div class="logic-dot" :style="{ background: getStrategyColor(id) }"></div>
                  <div class="logic-name">{{ getStrategy(id)?.name }}</div>
                </div>
                <div class="logic-body">{{ getStrategy(id)?.logicSummary }}</div>
              </div>
            </div>
          </section>

          <!-- 适合人群对比 -->
          <section class="result-section card">
            <div class="section-eyebrow">Target audience</div>
            <h2 class="section-heading">适合人群</h2>
            <div class="suitable-grid" :style="{ gridTemplateColumns: `repeat(${selectedIds.length}, 1fr)` }">
              <div v-for="id in selectedIds" :key="id" class="suitable-item">
                <div class="suitable-name">
                  <div class="suitable-dot" :style="{ background: getStrategyColor(id) }"></div>
                  {{ getStrategy(id)?.name }}
                </div>
                <div class="suitable-tags">
                  <span v-for="tag in getSuitableTags(id)" :key="tag" class="stag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </section>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { listStrategies, type StrategyItem } from '../services/strategy'
import * as echarts from 'echarts'

const COLORS = ['#d0680a', '#3a7fbf', '#6abf40', '#c04040', '#8b5cf6', '#d4a017']

const allStrategies = ref<StrategyItem[]>([])
const selectedIds = ref<number[]>([])
const searchText = ref('')
const activeCat = ref('')
const loading = ref(false)
const chartRef = ref<HTMLElement>()
const chartInstance = ref<echarts.ECharts | null>(null)
const activePeriod = ref('year')
const tsCache = ref<Record<string, Record<string, { date: string; ret: number | null; benchmark: number | null }[]>>>({})

const periods = [
  { key: 'week', label: '近一周' },
  { key: 'month', label: '近一月' },
  { key: 'quarter', label: '近一季' },
  { key: 'year', label: '近一年' },
  { key: 'inception', label: '成立以来' },
]

const categories = computed(() => {
  const map: Record<string, number> = {}
  for (const s of allStrategies.value) {
    const cat = s.navCategory || '其他'
    map[cat] = (map[cat] || 0) + 1
  }
  return Object.entries(map).map(([name, count]) => ({ name, count }))
})

const filteredStrategies = computed(() => {
  let list = allStrategies.value
  if (activeCat.value) list = list.filter(s => s.navCategory === activeCat.value)
  const q = searchText.value.trim().toLowerCase()
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q))
  return list
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `140px repeat(${selectedIds.value.length}, 1fr)`,
}))

const maxAnnReturn = computed(() => Math.max(...selectedIds.value.map(id => Math.abs(getStrategy(id)?.annualReturn ?? 0)), 1))
const maxDrawdown = computed(() => Math.max(...selectedIds.value.map(id => getStrategy(id)?.maxDrawdown ?? 1), 1))

function getStrategy(id: number) { return allStrategies.value.find(s => s.seed === id) }
function getStrategyColor(id: number) {
  const idx = selectedIds.value.indexOf(id)
  return COLORS[idx % COLORS.length]
}

function winRateClass(w: number) {
  if (w >= 80) return 'gain'; if (w >= 60) return 'mid'; return 'loss'
}

function fmt(v: number | null | undefined, decimals = 2, sign = true): string {
  if (v == null || typeof v !== 'number' || isNaN(v)) return '—'
  return (sign && v >= 0 ? '+' : '') + v.toFixed(decimals)
}

function getSuitableTags(id: number): string[] {
  const s = getStrategy(id)
  if (!s) return []
  const tags = s.tags || []
  const result: string[] = []
  if (tags.some(t => t.includes('稳健') || t.includes('绝对') || t.includes('低波'))) result.push('稳健型', '保守型')
  if (tags.some(t => t.includes('相对收益') || t.includes('增强'))) result.push('机构客户', '积极型')
  if (tags.some(t => t.includes('红利') || t.includes('低波'))) result.push('养老资金', '低风险')
  if (!result.length) result.push('各类通用')
  return [...new Set(result)].slice(0, 4)
}

function toggleStrategy(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

async function loadStrategies() {
  loading.value = true
  try {
    allStrategies.value = await listStrategies()
    // Pre-select top 4 by annual return on load
    const sorted = [...allStrategies.value].sort((a, b) => b.annualReturn - a.annualReturn)
    selectedIds.value = sorted.slice(0, 4).map(s => s.seed)
  } finally {
    loading.value = false
  }
}

async function ensureTsData(id: number, period: string) {
  const key = String(id)
  if (!tsCache.value[key]) tsCache.value[key] = {}
  if (!tsCache.value[key][period]) {
    try {
      const { getStrategyTimeSeries } = await import('../services/strategy')
      const ts = await getStrategyTimeSeries(String(id), period)
      tsCache.value[key][period] = ts.data || []
    } catch {
      tsCache.value[key][period] = []
    }
  }
}

async function switchPeriod(key: string) {
  activePeriod.value = key
  await Promise.all(selectedIds.value.map(id => ensureTsData(id, key)))
  renderChart()
}

async function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value)
  }
  const period = activePeriod.value
  const allDates = new Set<string>()
  for (const id of selectedIds.value) {
    const ts = tsCache.value[String(id)]?.[period] || []
    ts.forEach(t => { if (t.date) allDates.add(t.date) })
  }
  const sortedDates = [...allDates].sort()
  const series = selectedIds.value.map((id, i) => {
    const ts = tsCache.value[String(id)]?.[period] || []
    const tsMap: Record<string, number> = {}
    ts.forEach(t => { if (t.date) tsMap[t.date] = t.ret ?? 0 })
    return {
      name: getStrategy(id)?.name || '',
      color: getStrategyColor(id),
      values: sortedDates.map(d => tsMap[d] ?? null),
    }
  })

  chartInstance.value.setOption({
    backgroundColor: 'transparent',
    animation: true,
    grid: { top: 40, left: 56, right: 20, bottom: 44 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,252,246,0.96)',
      borderColor: 'rgba(23,55,91,0.15)',
      textStyle: { color: '#19324a' },
    },
    legend: { show: false },
    xAxis: {
      type: 'category', boundaryGap: false,
      data: sortedDates,
      axisLine: { lineStyle: { color: 'rgba(23,55,91,0.15)' } },
      axisLabel: {
        color: '#6d7c8d', margin: 12,
        formatter: (v: string, idx: number) => idx % Math.ceil(sortedDates.length / 6) === 0 ? v : ''
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6d7c8d', formatter: '{value}%' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(23,55,91,0.08)' } },
    },
    series: series.map(s => ({
      name: s.name,
      type: 'line', smooth: true, symbol: 'none',
      data: s.values,
      lineStyle: { width: 2.5, color: s.color },
    })),
  }, true)
}

watch(selectedIds, async (ids) => {
  if (ids.length >= 2) {
    await nextTick()
    if (!chartInstance.value && chartRef.value) {
      chartInstance.value = echarts.init(chartRef.value)
    }
    await Promise.all(ids.map(id => ensureTsData(id, activePeriod.value)))
    renderChart()
  }
}, { deep: true })

onMounted(async () => {
  await loadStrategies()
  // Wait for chart to be ready then render
  await nextTick()
  if (chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value)
    await Promise.all(selectedIds.value.map(id => ensureTsData(id, activePeriod.value)))
    renderChart()
  }
  window.addEventListener('resize', () => chartInstance.value?.resize())
})

onUnmounted(() => {
  chartInstance.value?.dispose()
  window.removeEventListener('resize', () => chartInstance.value?.resize())
})
</script>

<style scoped>
.compare-page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 48px; }

/* 全局颜色 */
.gain { color: #c24a00 !important; }
.loss { color: #b82020 !important; }
.mid { color: #9e722e !important; }
.muted { color: var(--muted); }
.bold { font-weight: 700; }

/* 卡片 */
.card {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 24px rgba(41, 61, 84, 0.1);
  border-radius: 20px;
  padding: 20px 16px;
}
.section-eyebrow { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.section-heading { margin: 0 0 18px; font-size: 20px; font-weight: 700; color: var(--text); }

/* 顶部 */
.compare-header h1 { margin: 8px 0 6px; font-size: 34px; }

/* 布局 */
.compare-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; max-height: calc(100vh - 140px); overflow: hidden; }

/* 左侧选择面板 */
.selector-panel { position: sticky; top: 80px; padding: 20px; max-height: calc(100vh - 140px); overflow: hidden; display: flex; flex-direction: column; gap: 14px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; }
.panel-count { font-size: 12px; color: var(--muted); }

/* 搜索 */
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--muted); }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border-radius: 10px; border: 1px solid rgba(23,55,91,0.15); background: rgba(255,255,255,0.8); color: var(--text); font-size: 13px; outline: none; box-sizing: border-box; }
.search-input:focus { border-color: var(--blue); }
.search-input::placeholder { color: var(--muted); }

/* 分类 */
.cat-filter { display: flex; flex-wrap: wrap; gap: 5px; }
.cat-btn { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(23,55,91,0.12); background: transparent; color: var(--muted); cursor: pointer; font-size: 11px; transition: all 0.2s; }
.cat-btn:hover { border-color: var(--blue); color: var(--blue); }
.cat-btn.active { background: var(--blue); border-color: var(--blue); color: #fff; }
.cat-num { font-size: 10px; }

/* 策略列表 */
.pick-list { flex: 1; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 6px; max-height: none; }
.pick-list::-webkit-scrollbar { width: 3px; }
.pick-list::-webkit-scrollbar-thumb { background: rgba(23,55,91,0.15); border-radius: 2px; }

.pick-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; border: 1.5px solid transparent; background: rgba(255,255,255,0.6); cursor: pointer; text-align: left; transition: all 0.2s; gap: 8px; }
.pick-row:hover { border-color: rgba(23,55,91,0.25); background: rgba(255,255,255,0.9); }
.pick-row.active { border-color: var(--blue); background: rgba(23,55,91,0.06); }
.pick-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.pick-check { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(23,55,91,0.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.pick-row.active .pick-check { background: var(--blue); border-color: var(--blue); color: #fff; }
.pick-check svg { width: 11px; height: 11px; }
.pick-info { min-width: 0; }
.pick-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pick-cat { font-size: 11px; color: var(--muted); }
.pick-metric { text-align: right; flex-shrink: 0; }
.pick-ret { font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.pick-sub { font-size: 10px; color: var(--muted); }

/* 右侧结果 */
.result-area { display: flex; flex-direction: column; gap: 18px; }

/* 空状态 */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 40px; text-align: center; }
.empty-icon { font-size: 48px; }
.empty-title { font-size: 20px; font-weight: 700; color: var(--text); }
.empty-sub { color: var(--muted); font-size: 14px; }

/* 已选标签 */
.one-selected { display: flex; flex-direction: column; gap: 12px; }
.selected-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.selected-chip { display: flex; align-items: center; gap: 6px; padding: 6px 10px 6px 8px; border-radius: 999px; border: 1.5px solid; background: rgba(255,255,255,0.8); }
.chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.chip-name { font-size: 13px; font-weight: 600; color: var(--text); }
.chip-remove { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 0 2px; }
.chip-remove:hover { color: var(--text); }
.one-hint { font-size: 13px; color: var(--muted); }

/* 对比表 */
.selected-bar { padding: 18px 22px; }
.compare-table { border: 1px solid rgba(23,55,91,0.1); border-radius: 12px; overflow: hidden; }
.ct-head, .ct-row { display: grid; }
.ct-head { background: rgba(23,55,91,0.05); }
.ct-row:nth-child(even) { background: rgba(23,55,91,0.02); }
.ct-cell { padding: 11px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.col-metric { color: var(--muted); }
.col-strat { flex-direction: column; align-items: flex-start; gap: 2px; }
.strat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.strat-name { font-size: 13px; font-weight: 700; color: var(--text); }
.strat-cat { font-size: 11px; color: var(--muted); }
.ct-val { font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }

/* 图表区 */
.chart-toolbar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.period-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.period-tab { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(23,55,91,0.15); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.period-tab:hover { border-color: var(--blue); color: var(--blue); }
.period-tab.active { background: var(--blue); border-color: var(--blue); color: #fff; }

/* 迷你指标条 */
.mkpi-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.mkpi-row { display: grid; grid-template-columns: 120px 1fr; gap: 12px; align-items: center; }
.mkpi-label { display: flex; align-items: center; gap: 8px; }
.mkpi-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.mkpi-name { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mkpi-bars { display: flex; flex-direction: column; gap: 5px; }
.mkpi-bar-item { display: grid; grid-template-columns: 32px 1fr 52px; gap: 8px; align-items: center; }
.mkpi-bar-label { font-size: 10px; color: var(--muted); }
.mkpi-bar-track { height: 4px; background: rgba(23,55,91,0.1); border-radius: 2px; overflow: hidden; }
.mkpi-bar-fill { height: 100%; border-radius: 2px; min-width: 3px; transition: width 0.5s ease; }
.mkpi-bar-fill.gain { background: #d0680a; }
.mkpi-bar-fill.loss { background: #b82020; }
.mkpi-val { font-size: 12px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; text-align: right; }

.compare-chart { height: 280px; }
.chart-legend { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 10px; justify-content: center; }
.legend-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--muted); }
.legend-line { width: 20px; height: 3px; border-radius: 2px; }

/* 逻辑对比 */
.logic-grid { display: grid; gap: 14px; }
.logic-item { padding: 16px; border-radius: 12px; background: rgba(23,55,91,0.04); }
.logic-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.logic-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.logic-name { font-size: 14px; font-weight: 700; color: var(--text); }
.logic-body { font-size: 13px; color: var(--muted); line-height: 1.85; white-space: pre-wrap; }

/* 适合人群 */
.suitable-grid { display: grid; gap: 14px; }
.suitable-item { padding: 16px; border-radius: 12px; background: rgba(23,55,91,0.04); }
.suitable-name { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
.suitable-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.suitable-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.stag { font-size: 12px; padding: 4px 12px; border-radius: 999px; background: rgba(23,55,91,0.08); color: var(--text); border: 1px solid rgba(23,55,91,0.12); }

@media (max-width: 1100px) {
  .compare-layout { grid-template-columns: 1fr; }
  .selector-panel { position: static; max-height: none; }
  .pick-list { max-height: 300px; }
  .compare-table .ct-head { display: none; }
  .ct-head, .ct-row { grid-template-columns: 100px 1fr !important; }
}
@media (max-width: 640px) {
  .logic-grid, .suitable-grid { grid-template-columns: 1fr !important; }
}
</style>
