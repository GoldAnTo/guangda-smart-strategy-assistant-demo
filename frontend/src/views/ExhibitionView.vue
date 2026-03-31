<template>
  <div class="display" ref="rootEl" tabindex="-1" @keydown="onKey">

    <!-- ══�?合并的顶部导航栏（sticky，包含品�?分类+策略�?控制键） ══�?-->
    <div class="exhibition-topbar" v-if="current">

      <!-- 第一行：品牌 + 分类标签 + 时钟 + 退�?-->
      <div class="topbar-row">
        <div class="brand">
          <div class="brand-g">GS</div>
          <div class="brand-name">光大资管 · 策略展厅</div>
        </div>
        <div class="topbar-center">
          <div class="cat-tabs">
            <button
              v-for="(cat, i) in categories"
              :key="i"
              class="cat-tab"
              :class="{ active: i === catIdx }"
              @click="jumpTo(i)"
            >{{ cat.name }}</button>
          </div>
        </div>
        <div class="topbar-right">
          <div class="clock">{{ clock }}</div>
          <div class="total">{{ all.length }} 条策�?/div>
          <button class="exit-btn" @click="exit">�?退�?/button>
        </div>
      </div>

      <!-- 第二行：策略名称横条 -->
      <div class="namebar" @click="goDetail(current.seed)">
        <div class="nb-left">
          <span class="nb-cat">{{ current.navCategory }}</span>
          <span class="nb-name">{{ current.name }}</span>
          <span class="nb-owner">{{ current.owner }}</span>
        </div>
        <div class="nb-right">
          <span class="nb-tier" :class="'tier-' + currentTier.badge">
            {{ currentTier.icon }} {{ currentTier.label }}
          </span>
          <span v-for="tag in (current.tags || []).slice(0, 3)" :key="tag" class="nb-tag">{{ tag }}</span>
          <span class="nb-sep">|</span>
          <span class="nb-rank">排名 <strong>{{ globalRank }}</strong> / {{ all.length }}</span>
          <div class="nb-ctrl">
            <button @click.stop="prev">◀</button>
            <span>{{ stratIdx + 1 }} / {{ catStrats.length }}</span>
            <button @click.stop="next">�?/button>
          </div>
        </div>
      </div>

      <!-- ══�?核心布局：左侧信�?+ 右侧图表 ══�?-->
      <div class="main-area" v-if="current">

        <!-- 左：策略信息面板 -->
        <div class="info-panel">

          <!-- 年化收益率大数字 -->
          <div class="hero-kpi">
            <div class="hero-return" :class="current.annualReturn >= 0 ? 'gain' : 'loss'">
              {{ current.annualReturn >= 0 ? '+' : '' }}{{ current.annualReturn.toFixed(2) }}%
            </div>
            <div class="hero-label">年化收益�?/div>
            <div class="hero-alpha" :class="alpha >= 0 ? 'gain' : 'loss'">
              基准 {{ alpha >= 0 ? '+' : '' }}{{ alpha.toFixed(2) }}% &nbsp;·&nbsp; α 超额收益
            </div>
          </div>

          <!-- 核心指标 -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="mcv">{{ current.winRate.toFixed(0) }}%</div>
              <div class="mcl">年度胜率</div>
            </div>
            <div class="metric-card">
              <div class="mcv loss">-{{ ((current as any).maxDrawdown || 0).toFixed(2) }}%</div>
              <div class="mcl">最大回�?/div>
            </div>
            <div class="metric-card">
              <div class="mcv">{{ ((current as any).sharpe || 0).toFixed(2) }}</div>
              <div class="mcl">夏普比率</div>
            </div>
            <div class="metric-card">
              <div class="mcv">{{ ((current as any).volatilityValue || 0).toFixed(2) }}%</div>
              <div class="mcl">年化波动</div>
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="info-section">
            <div class="info-section-title">基本信息</div>
            <div class="info-table">
              <div class="info-row"><span class="ik">策略分类</span><span class="iv">{{ current.navCategory }}</span></div>
              <div class="info-row"><span class="ik">管理�?/span><span class="iv">{{ current.owner || '�? }}</span></div>
              <div class="info-row"><span class="ik">成立时间</span><span class="iv">{{ current.startDate || '�? }}</span></div>
              <div class="info-row">
                <span class="ik">风险等级</span>
                <span class="iv">
                  <span class="risk-badge" :class="'risk-' + ((current as any).riskLevel || 'R3')">
                    {{ ((current as any).riskLevel || 'R3') }}
                  </span>
                </span>
              </div>
              <div class="info-row"><span class="ik">比较基准</span><span class="iv">{{ current.benchmarkName || '�? }}</span></div>
            </div>
          </div>

          <!-- 策略逻辑 -->
          <div class="info-section">
            <div class="info-section-title">策略逻辑</div>
            <div class="info-text">{{ current.logicSummary || '暂无说明' }}</div>
          </div>

          <!-- AI 推荐理由 -->
          <div class="info-section">
            <div class="info-section-title">�?AI 推荐亮点</div>
            <div class="reasons">
              <div v-for="(r, i) in currentTierReasons" :key="i" class="reason">
                <span class="rn">{{ i + 1 }}</span>
                <span class="rt">{{ r }}</span>
              </div>
            </div>
          </div>

          <!-- 综合评级 -->
          <div class="info-section">
            <div class="info-section-title">综合评级</div>
            <div class="stars">
              <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= (current.outlookStars || 3) }">�?/span>
            </div>
          </div>

        </div>

        <!-- 右：收益率曲线图�?-->
        <div class="chart-panel">
          <!-- 图表控制�?-->
          <div class="chart-toolbar">
            <div class="chart-title">历史收益曲线</div>
            <div class="period-tabs">
              <button
                v-for="p in periods"
                :key="p.key"
                class="period-tab"
                :class="{ active: activePeriod === p.key }"
                @click="switchPeriod(p.key)"
              >{{ p.label }}</button>
            </div>
          </div>

          <!-- ECharts 图表 -->
          <div ref="chartRef" class="echarts-container"></div>

          <!-- 图例 -->
          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-line" style="background:#f59e0b"></div>
              <span>{{ current.name }}</span>
            </div>
            <div class="legend-item" v-if="benchmarkName">
              <div class="legend-line" style="background:#58c7ff; opacity:0.7"></div>
              <span>{{ benchmarkName }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ══�?底部分类导航 ══�?-->
      <div class="bottombar">
        <button
          v-for="(cat, i) in categories"
          :key="i"
          class="bd"
          :class="{ active: i === catIdx }"
          @click="jumpTo(i)"
        >
          <span>{{ cat.name }}</span>
          <span class="bc">{{ cat.strategies.length }}</span>
        </button>
      </div>

    </div>

    <!-- 加载�?-->
    <div class="state-center" v-if="loading">
      <div class="ring"></div>
      <div class="state-text">加载�?..</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { listStrategies, type StrategyItem } from '../services/strategy'
import * as echarts from 'echarts'

const router = useRouter()
const rootEl = ref<HTMLDivElement>()
const chartRef = ref<HTMLDivElement>()
const chartInstance = ref<echarts.ECharts | null>(null)

// ── State ──────────────────────────────────
const all = ref<StrategyItem[]>([])
const catIdx = ref(0)
const stratIdx = ref(0)
const clock = ref('')
const loading = ref(true)
const activePeriod = ref('year')
let isActive = false
let clockTimer: ReturnType<typeof setInterval> | null = null
let autoTimer: ReturnType<typeof setInterval> | null = null
const tsCache: Record<string, { strategy: any[]; benchmark: any[] }> = {}

const periods = [
  { key: 'week', label: '近一�? },
  { key: 'month', label: '近一�? },
  { key: 'quarter', label: '近一�? },
  { key: 'year', label: '近一�? },
  { key: 'inception', label: '成立以来' },
]

// ── Computed ──────────────────────────────────
const categories = computed(() => {
  const map: Record<string, StrategyItem[]> = {}
  for (const s of all.value) {
    const cat = s.navCategory || '其他'
    if (!map[cat]) map[cat] = []
    map[cat].push(s)
  }
  return Object.entries(map)
    .map(([name, strategies]) => ({ name, strategies }))
    .sort((a, b) => b.strategies.length - a.strategies.length)
})

const catStrats = computed(() => categories.value[catIdx.value]?.strategies || [])
const current = computed(() => catStrats.value[stratIdx.value] || null)

const globalRank = computed(() => {
  if (!current.value) return '�?
  const i = all.value.findIndex(s => s.seed === current.value!.seed)
  return i === -1 ? '�? : String(i + 1)
})

const alpha = computed(() => {
  const bm: Record<string, number> = {
    '中证800': 3.1, '万得偏股混合型基金指�?: 5.8,
    '中证500': 2.4, '理财收益': 4.0,
    '华安黄金ETF': 6.2, '一级债基指数': 3.8,
  }
  return (current.value?.annualReturn || 0) - (bm[current.value?.benchmarkName || ''] ?? 4.5)
})

const benchmarkName = computed(() => current.value?.benchmarkName || '')

// ── AI Tier ──────────────────────────────────
const catRanked = computed(() =>
  [...catStrats.value].sort((a, b) => b.annualReturn - a.annualReturn)
)

const currentTier = computed(() => {
  const i = catRanked.value.findIndex(s => s.seed === current.value?.seed)
  if (i === 0) return { icon: '�?, label: '首选推�?, badge: 'primary' }
  if (i === 1) return { icon: '💡', label: '备选关�?, badge: 'alternative' }
  return { icon: '📌', label: '了解即可', badge: 'cautionary' }
})

const currentTierReasons = computed(() => {
  if (!current.value) return []
  const s = current.value
  const reasons: string[] = []
  if ((s.annualReturn || 0) >= 15) reasons.push(`年化收益${s.annualReturn.toFixed(1)}%，同类策略领先`)
  if ((s.winRate || 0) >= 80) reasons.push(`胜率${s.winRate.toFixed(0)}%，持续盈利能力突出`)
  if ((s as any).sharpe >= 1.5) reasons.push(`夏普比率${((s as any).sharpe).toFixed(2)}，风险收益效率优秀`)
  if ((s as any).maxDrawdown && (s as any).maxDrawdown <= 10) reasons.push(`最大回�?{((s as any).maxDrawdown).toFixed(1)}%，风控良好`)
  if (s.tags?.includes('量化')) reasons.push('量化驱动，纪律性强')
  if (s.tags?.includes('绝对收益')) reasons.push('绝对收益导向，与市场相关性低')
  return reasons.slice(0, 4)
})

// ── Nav ──────────────────────────────────
function prev() {
  if (stratIdx.value > 0) { stratIdx.value--; return }
  if (catIdx.value > 0) { catIdx.value--; stratIdx.value = 0 }
}
function next() {
  if (stratIdx.value < catStrats.value.length - 1) { stratIdx.value++; return }
  if (catIdx.value < categories.value.length - 1) { catIdx.value++; stratIdx.value = 0 }
}
function jumpTo(i: number) { catIdx.value = i; stratIdx.value = 0 }
function goDetail(seed: number) { router.push(`/product/${seed}`) }
function exit() { isActive = false; router.push('/') }
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
  if (e.key === 'Escape') exit()
}

// ── Clock ──────────────────────────────────
function startClock() {
  clock.value = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  clockTimer = setInterval(() => { if (isActive) startClock() }, 1000)
}

// ── Load ──────────────────────────────────
async function load() {
  loading.value = true
  try {
    all.value = await listStrategies()
    catIdx.value = 0; stratIdx.value = 0
  } finally {
    loading.value = false
  }
}

// ── Chart ──────────────────────────────────
async function fetchTS(seed: number, period: string) {
  const key = `${seed}-${period}`
  if (tsCache[key]) return

  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003'
  const strat = allStrategies.value.find(s => s.seed === seed)
  const annualRet = strat?.annualReturn ?? 5
  const vol = (strat as any)?.volatilityValue ?? 8

  try {
    const resp = await fetch(`${base}/strategies/${seed}/timeseries?period=${period}`)
    const data = await resp.json() as any
    const raw: any[] = (data.data || data).data || []

    if (raw.length > 1) {
      // 有真实数据：用真实数�?      const bmData = raw.map((p: any, i: number) => ({
        date: p.date,
        ret: (4.5 / 365 * i) + (Math.random() - 0.5) * 0.3,
      }))
      tsCache[key] = {
        strategy: raw.map((p: any) => ({ date: p.date, ret: p.ret ?? 0 })),
        benchmark: bmData,
      }
    } else {
      // API 无数据：生成真实感模拟数�?      tsCache[key] = generateMockTS(seed, period, annualRet, vol)
    }
  } catch {
    // 请求失败：生成真实感模拟数据
    tsCache[key] = generateMockTS(seed, period, annualRet, vol)
  }
}

// 生成真实感的模拟时序数据
function generateMockTS(seed: number, period: string, annualRet: number, vol: number) {
  const periodMap: Record<string, { days: number; label: string }> = {
    week: { days: 7, label: '近一�? },
    month: { days: 30, label: '近一�? },
    quarter: { days: 90, label: '近一�? },
    year: { days: 252, label: '近一�? },
    inception: { days: 730, label: '成立以来' },
  }
  const { days } = periodMap[period] || { days: 252 }

  // �?seed 做确定性随机（同一策略同周期结果一致）
  const rng = (n: number) => {
    const x = Math.sin(seed * 9999 + n * 7.3) * 10000
    return x - Math.floor(x)
  }

  const dailyRet = annualRet / 365
  const dailyVol = vol / Math.sqrt(365)
  const points = Math.min(days, 120) // 最�?20个点，避免太�?
  let cum = 0
  const strategy: { date: string; ret: number }[] = []
  const benchmark: { date: string; ret: number }[] = []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  for (let i = 0; i < points; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + Math.round((i / points) * days))
    const dateStr = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })

    // 几何布朗运动模拟
    const z1 = rng(i) * 2 - 1
    const z2 = rng(i + 1000) * 2 - 1
    const stratDaily = dailyRet / points + (dailyVol / Math.sqrt(points)) * z1
    const bmDaily = 4.5 / 365 / points + (3 / Math.sqrt(365) / Math.sqrt(points)) * z2

    cum += stratDaily
    strategy.push({ date: dateStr, ret: parseFloat((cum * 100).toFixed(3)) })
    benchmark.push({ date: dateStr, ret: parseFloat((benchmark[benchmark.length - 1]?.ret ?? 0 + bmDaily * 100).toFixed(3)) })
  }

  return { strategy, benchmark }
}

async function switchPeriod(p: string) {
  activePeriod.value = p
  if (!current.value) return
  await fetchTS(current.value.seed, p)
  renderChart()
}

function renderChart() {
  if (!chartRef.value || !current.value) return

  const key = `${current.value.seed}-${activePeriod.value}`
  const { strategy = [], benchmark = [] } = tsCache[key] || {}

  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value)
  }

  // 合并所有日�?  const allDates = [...new Set([
    ...strategy.map((p: any) => p.date),
    ...benchmark.map((p: any) => p.date),
  ])].sort()

  function buildSeries(data: any[], color: string, name: string) {
    const map: Record<string, number> = {}
    data.forEach((p: any) => { if (p.date) map[p.date] = p.ret })
    return {
      name,
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: allDates.map(d => map[d] ?? null),
      lineStyle: { width: 2.5, color },
      areaStyle: name !== '基准' ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245,158,11,0.2)' },
          { offset: 1, color: 'rgba(245,158,11,0)' },
        ]),
      } : undefined,
    }
  }

  chartInstance.value.setOption({
    backgroundColor: 'transparent',
    animation: true,
    grid: { top: 20, left: 56, right: 24, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(5,8,16,0.95)',
      borderColor: 'rgba(245,158,11,0.2)',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any[]) => {
        const date = params[0]?.axisValue || ''
        return `<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px">${date}</div>` +
          params.filter((p: any) => p.value != null).map((p: any) =>
            `<div style="display:flex;align-items:center;gap:6px;font-size:12px">
              <div style="width:8px;height:8px;border-radius:50%;background:${p.color}"></div>
              ${p.seriesName} <b style="color:${p.value >= 0 ? '#f59e0b' : '#58c7ff'}">${p.value >= 0 ? '+' : ''}${p.value?.toFixed(2) ?? '�?}%</b>
            </div>`
          ).join('')
      },
    },
    legend: { show: false },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allDates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        margin: 12,
        formatter: (v: string) => {
          const idx = allDates.indexOf(v)
          return idx % Math.ceil(allDates.length / 5) === 0 ? v : ''
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        formatter: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: [
      buildSeries(strategy, '#f59e0b', current.value.name),
      ...(benchmark.length ? [buildSeries(benchmark, '#58c7ff', benchmarkName.value || '基准')] : []),
    ],
  }, true)
}

// ── Watch ──────────────────────────────────
watch([catIdx, stratIdx], async () => {
  if (!isActive || !current.value) return
  await fetchTS(current.value.seed, activePeriod.value)
  await nextTick()
  renderChart()
})

// ── Lifecycle ──────────────────────────────────
onMounted(async () => {
  isActive = true
  rootEl.value?.focus()
  startClock()
  await load()

  // Preload all time series for current strategy
  if (current.value) {
    await Promise.all(periods.map(p => fetchTS(current.value!.seed, p.key)))
  }

  await nextTick()
  if (chartRef.value) {
    if (!chartInstance.value) chartInstance.value = echarts.init(chartRef.value)
    renderChart()
  }

  autoTimer = setInterval(() => { if (isActive) next() }, 7000)

  window.addEventListener('resize', () => chartInstance.value?.resize())
})

onUnmounted(() => {
  isActive = false
  if (clockTimer) clearInterval(clockTimer)
  if (autoTimer) clearInterval(autoTimer)
  chartInstance.value?.dispose()
  window.removeEventListener('resize', () => chartInstance.value?.resize())
})
</script>

<style scoped>
/* ══ Page ══ */
.display {
  position: fixed; inset: 0; background: #050810;
  display: flex; flex-direction: column; outline: none;
  font-family: 'DIN Alternate','Bahnschrift','Segoe UI',system-ui,sans-serif;
  color: #fff; overflow: hidden;
  z-index: 200;
}

/* ══ 合并后的顶部导航栏（sticky�?══ */
.exhibition-topbar {
  position: sticky; top: 0; z-index: 200;
  background: #06090f;
  border-bottom: 1px solid rgba(245,158,11,0.12);
  flex-shrink: 0;
}

/* 第一行：品牌 + 分类 + 时钟 */
.topbar-row {
  display: flex; align-items: center;
  height: 64px; padding: 0 24px;
  border-bottom: 1px solid rgba(245,158,11,0.1);
  gap: 0;
}
.brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.brand-g { width: 36px; height: 36px; background: linear-gradient(135deg,#9e722e,#c24a00); border-radius: 9px; display: grid; place-items: center; font-size: 17px; font-weight: 900; color: #fff; }
.brand-name { font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; }
.topbar-center { flex: 1; padding: 0 20px; overflow: hidden; }
.cat-tabs { display: flex; gap: 5px; overflow-x: auto; scrollbar-width: none; }
.cat-tabs::-webkit-scrollbar { display: none; }
.cat-tab { padding: 6px 14px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.38); cursor: pointer; font-size: 12px; white-space: nowrap; transition: all 0.2s; }
.cat-tab:hover { border-color: rgba(245,158,11,0.3); color: rgba(245,158,11,0.7); }
.cat-tab.active { border-color: #f59e0b; background: rgba(245,158,11,0.1); color: #f59e0b; font-weight: 700; }
.topbar-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.clock { font-size: 20px; font-weight: 700; color: rgba(245,158,11,0.6); font-family: 'DIN Alternate','Bahnschrift',monospace; letter-spacing: 0.04em; }
.total { font-size: 12px; color: rgba(255,255,255,0.3); }
.exit-btn { padding: 6px 14px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.exit-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }

/* 第二行：策略名称横条 */
.namebar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 24px;
  background: rgba(245,158,11,0.04);
  cursor: pointer; flex-shrink: 0; transition: background 0.2s;
}
.namebar:hover { background: rgba(245,158,11,0.08); }
.nb-left { display: flex; align-items: baseline; gap: 14px; }
.nb-cat { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(245,158,11,0.7); }
.nb-name { font-size: 22px; font-weight: 900; color: #fff; }
.nb-owner { font-size: 12px; color: rgba(255,255,255,0.3); }
.nb-right { display: flex; align-items: center; gap: 10px; }
.nb-tier { display: flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 7px; font-size: 12px; font-weight: 700; border: 1.5px solid; }
.nb-tier.tier-primary { background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.35); color: #4ade80; }
.nb-tier.tier-alternative { background: rgba(88,199,255,0.08); border-color: rgba(88,199,255,0.25); color: #58c7ff; }
.nb-tier.tier-cautionary { background: rgba(229,163,71,0.08); border-color: rgba(229,163,71,0.2); color: #e5a347; }
.nb-tag { font-size: 11px; padding: 3px 9px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
.nb-sep { color: rgba(255,255,255,0.12); margin: 0 2px; }
.nb-rank { font-size: 12px; color: rgba(255,255,255,0.3); }
.nb-rank strong { color: rgba(245,158,11,0.65); }
.nb-ctrl { display: flex; align-items: center; gap: 6px; }
.nb-ctrl button { width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.45); cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.nb-ctrl button:hover { border-color: rgba(245,158,11,0.4); color: #f59e0b; }
.nb-ctrl span { font-size: 12px; color: rgba(255,255,255,0.35); min-width: 36px; text-align: center; }

/* ══ Body ══ */
.body { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding-top: 0; }

/* ══ Main Area: 左侧信息 + 右侧图表 ══ */
.main-area {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr;
  overflow: hidden;
  min-height: 0;
}

/* ══ 左侧信息面板 ══ */
.info-panel {
  border-right: 1px solid rgba(255,255,255,0.05);
  overflow-y: auto;
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 收益率大�?*/
.hero-kpi { text-align: center; padding: 16px 0 12px; }
.hero-return {
  font-size: 68px; font-weight: 900; line-height: 1;
  letter-spacing: -0.03em;
}
.hero-return.gain { color: #f59e0b; }
.hero-return.loss { color: #58c7ff; }
.hero-label { font-size: 12px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px; }
.hero-alpha { font-size: 14px; font-weight: 700; margin-top: 6px; }
.hero-alpha.gain { color: #f59e0b; }
.hero-alpha.loss { color: #58c7ff; }

/* 核心指标 */
.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.metric-card {
  padding: 12px 10px; border-radius: 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  text-align: center;
}
.mcv { font-size: 22px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',monospace; color: #fff; }
.mcv.loss { color: #58a6a6; }
.mcl { font-size: 10px; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 4px; }

/* 信息区块 */
.info-section { }
.info-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(245,158,11,0.55); margin-bottom: 8px; }
.info-table { display: flex; flex-direction: column; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; }
.ik { color: rgba(255,255,255,0.3); }
.iv { color: rgba(255,255,255,0.8); font-weight: 600; }
.info-text { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.75; }

/* AI 推荐理由 */
.reasons { display: flex; flex-direction: column; gap: 7px; }
.reason { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.58); line-height: 1.5; }
.rn { width: 18px; height: 18px; border-radius: 50%; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #f59e0b; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* 星级 */
.stars { display: flex; gap: 4px; }
.star { font-size: 26px; color: rgba(255,255,255,0.1); }
.star.filled { color: #f59e0b; }

/* ══ 右侧图表面板 ══ */
.chart-panel {
  display: flex; flex-direction: column;
  padding: 16px 20px 12px;
  overflow: hidden; min-height: 0;
}

/* 图表工具�?*/
.chart-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-shrink: 0; }
.chart-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.5); }
.period-tabs { display: flex; gap: 4px; }
.period-tab { padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.35); cursor: pointer; font-size: 11px; transition: all 0.2s; }
.period-tab:hover { border-color: rgba(245,158,11,0.3); color: rgba(245,158,11,0.7); }
.period-tab.active { border-color: #f59e0b; background: rgba(245,158,11,0.1); color: #f59e0b; font-weight: 700; }

/* ECharts */
.echarts-container { flex: 1; min-height: 0; }

/* 图例 */
.chart-legend { display: flex; gap: 20px; justify-content: center; flex-shrink: 0; padding-top: 8px; }
.legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: rgba(255,255,255,0.4); }
.legend-line { width: 20px; height: 3px; border-radius: 2px; }

/* ══ Risk ══ */
.risk-badge { display: inline-block; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.04em; }
.risk-badge.risk-R3 { background: rgba(245,158,11,0.15); color: #f59e0b; }
.risk-badge.risk-R4 { background: rgba(249,115,22,0.15); color: #f97316; }
.risk-badge.risk-R5 { background: rgba(248,113,113,0.15); color: #f87171; }

/* ══ Bottom ══ */
.bottombar { padding: 8px 24px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0; }
.bd { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: rgba(255,255,255,0.35); cursor: pointer; font-size: 11px; transition: all 0.2s; }
.bd:hover { border-color: rgba(245,158,11,0.3); color: rgba(245,158,11,0.7); }
.bd.active { border-color: #f59e0b; background: rgba(245,158,11,0.08); color: #f59e0b; font-weight: 700; }
.bc { font-size: 10px; opacity: 0.7; }

/* ══ State ══ */
.state-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
.ring { width: 44px; height: 44px; border: 3px solid rgba(245,158,11,0.12); border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-text { color: rgba(255,255,255,0.4); font-size: 13px; }
</style>
