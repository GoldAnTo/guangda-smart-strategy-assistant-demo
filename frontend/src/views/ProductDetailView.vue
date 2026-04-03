<template>
  <div v-if="loading" class="page-shell detail-loading">
    <el-skeleton :rows="8" animated />
  </div>

  <div v-else-if="error" class="page-shell">
    <el-result icon="error" :title="error" sub-title="请返回策略目录或检查策略编号">
      <template #extra>
        <el-button type="primary" @click="router.push('/products')">返回策略目录</el-button>
      </template>
    </el-result>
  </div>

  <div v-else-if="strategy" class="page-shell detail-page">

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 面包屑 -->
    <!-- ═══════════════════════════════════════════════ -->
    <nav class="breadcrumb">
      <button class="bc-item" @click="router.push('/products')">策略目录</button>
      <span class="bc-sep">›</span>
      <span class="bc-current">{{ strategy?.navCategory || '—' }}</span>
      <span class="bc-sep">›</span>
      <span class="bc-current bold">{{ strategy?.name || '加载中' }}</span>
    </nav>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 主标题区 -->
    <!-- ═══════════════════════════════════════════════ -->
    <header class="detail-head card">
      <div class="head-left">
        <div class="head-meta">
          <span class="cat-badge">{{ strategy?.navCategory || '—' }}</span>
          <span class="strategy-id">No.{{ strategy?.seed || '—' }}</span>
          <div class="stars-row">
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= (strategy?.outlookStars || 3) }">★</span>
          </div>
        </div>
        <h1 class="strategy-name">{{ strategy?.name || '加载中' }}</h1>
        <div class="owner-row">
          <span class="owner-icon">👤</span>
          <span class="owner-name">{{ strategy?.owner || '—' }}</span>
          <span class="dot">·</span>
          <span class="start-date">成立 {{ strategy?.startDate || '—' }}</span>
        </div>
        <div class="tag-row">
          <span v-for="tag in ((strategy?.tags) || []).slice(0, 5)" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <!-- 策略定位标签 -->
        <div class="strategy-position-tags" v-if="strategy">
          <span class="ptag risk" :class="'risk-' + (strategy.riskLevel || '')">{{ strategy.riskLevelDisplay || strategy.riskLevel || '' }}</span>
          <span class="ptag horizon" v-if="strategy.investmentHorizonDisplay">{{ strategy.investmentHorizonDisplay }}</span>
          <span class="ptag cat" v-if="strategy.navCategory">{{ strategy.navCategory }}</span>
          <span class="ptag liquidity" v-if="strategy.liquidityDisplay">{{ strategy.liquidityDisplay }}</span>
        </div>
      </div>

      <!-- 核心指标 -->
      <div class="head-kpis">
        <div class="kpi-card">
          <div class="kpi-num" :class="(strategy.annualReturn ?? 0) >= 0 ? 'gain' : 'loss'">
            {{ fmt(strategy.annualReturn) }}%
          </div>
          <div class="kpi-lbl">年化收益</div>
          <div class="kpi-sub" :class="(strategy.annualReturn ?? 0) >= 0 ? 'gain' : 'loss'">
            vs 基准 {{ excessReturn }}%
          </div>
        </div>
        <div class="kpi-sep"></div>
        <div class="kpi-card">
          <div class="kpi-num" :class="winRateClass(strategy.winRate ?? 0)">{{ strategy.winRate != null ? strategy.winRate.toFixed(0) + '%' : '—' }}</div>
          <div class="kpi-lbl">年度胜率</div>
          <div class="kpi-sub muted">{{ winRateYear }} 年均胜</div>
        </div>
        <div class="kpi-sep"></div>
        <div class="kpi-card">
          <div class="kpi-num neutral">{{ strategy?.benchmarkName || '—' }}</div>
          <div class="kpi-lbl">比较基准</div>
          <div class="kpi-sub muted">{{ strategy?.structure || '标准结构' }}</div>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 图表区 -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="chart-section card">
      <div class="chart-toolbar">
        <div>
          <div class="section-eyebrow">收益曲线对比</div>
          <h2 class="chart-heading">历史业绩表现</h2>
        </div>
        <div class="period-tabs">
          <button v-for="p in periods" :key="p.key"
            class="period-tab" :class="{ active: activePeriod === p.key }"
            @click="switchPeriod(p.key)">{{ p.label }}</button>
        </div>
      </div>

      <!-- 指标横条 -->
      <div class="kpi-bar-row" v-if="chartKpis.length">
        <div class="kpi-bar-item" v-for="item in chartKpis" :key="item.label">
          <span class="kb-label">{{ item.label }}</span>
          <div class="kb-track">
            <div class="kb-fill" :class="item.tone" :style="{ width: item.pct + '%' }"></div>
          </div>
          <span class="kb-val" :class="item.tone">{{ item.value }}</span>
        </div>
      </div>

      <div ref="chartRef" class="chart-canvas"></div>

      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-dot strategy-dot"></div>
          <span>{{ strategy?.name || '—' }}</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot benchmark-dot"></div>
          <span>{{ strategy?.benchmarkName || '—' }}</span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 策略 vs 基准 对比表 -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="compare-section card">
      <div class="section-eyebrow">Performance comparison</div>
      <h2 class="section-heading">策略 vs 基准 · 多维对比</h2>
      <div class="compare-table">
        <div class="ct-row header">
          <div class="ct-cell col-metric">指标</div>
          <div class="ct-cell col-strategy">{{ strategy?.name || '—' }}</div>
          <div class="ct-cell col-benchmark">{{ strategy?.benchmarkName || '—' }}</div>
          <div class="ct-cell col-diff">差异</div>
        </div>
        <div class="ct-row" v-for="row in compareRows" :key="row.metric">
          <div class="ct-cell col-metric muted">{{ row.metric }}</div>
          <div class="ct-cell col-strategy">
            <span class="ct-val" :class="row.strategyTone">{{ row.strategyVal }}</span>
          </div>
          <div class="ct-cell col-benchmark muted">{{ row.benchmarkVal }}</div>
          <div class="ct-cell col-diff">
            <span class="ct-diff" :class="row.diffTone">{{ row.diffSign }}{{ row.diffVal }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 人群匹配 -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="crowd-section card">
      <div class="section-eyebrow">Target audience</div>
      <h2 class="section-heading">策略人群匹配</h2>
      <p class="crowd-intro">{{ strategy?.positioning || '该策略适用于多种市场环境，投资者可根据自身风险偏好选择。' }}</p>
      <div class="suitable-row">
        <div class="suitable-block ok-block">
          <div class="sb-title">✅ 适合人群</div>
          <div class="sb-tags">
            <span class="stag" v-for="s in suitableTags" :key="s">{{ s }}</span>
          </div>
        </div>
        <div class="suitable-block no-block">
          <div class="sb-title">❌ 不适合</div>
          <div class="sb-tags">
            <span class="stag" v-for="s in notSuitableTags" :key="s">{{ s }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 策略逻辑 -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="logic-section card">
      <div class="section-eyebrow">Core logic</div>
      <h2 class="section-heading">策略逻辑摘要</h2>
      <div class="logic-text">{{ strategy?.logicSummary || '—' }}</div>
      <div class="logic-disclaimer">📌 仅供内部研究展示，不构成投资建议</div>
    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- AI 归因分析 -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="attr-section card">
      <div class="section-eyebrow">AI Attribution</div>
      <h2 class="section-heading">策略归因分析</h2>

      <!-- 周期选择 -->
      <div class="attr-periods" v-if="strategy && !attrResult && !attrLoading">
        <div class="ap-hint">选择一个分析周期：</div>
        <div class="ap-tabs">
          <button
            v-for="p in attrPeriods"
            :key="p.key"
            class="ap-tab"
            :class="{ active: attrPeriod === p.key }"
            @click="attrPeriod = p.key; loadAttr()"
          >{{ p.label }}</button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="attr-loading" v-if="attrLoading">
        <div class="spinner-ring"></div>
        <div class="al-text">AI 正在从四个维度深度分析策略归因...</div>
      </div>

      <!-- 归因结果 -->
      <div class="attr-body" v-if="attrResult && !attrLoading">
        <!-- 顶部指标卡 -->
        <div class="attr-metrics-row">
          <div class="am-card">
            <div class="am-val" :class="attrResult.periodReturn >= 0 ? 'gain' : 'loss'">
              {{ attrResult.periodReturn >= 0 ? '+' : '' }}{{ attrResult.periodReturn?.toFixed(2) }}%
            </div>
            <div class="am-label">{{ attrResult.period }}收益</div>
          </div>
          <div class="am-card">
            <div class="am-val" :class="attrResult.annualReturn >= 0 ? 'gain' : 'loss'">
              {{ attrResult.annualReturn >= 0 ? '+' : '' }}{{ attrResult.annualReturn?.toFixed(2) }}%
            </div>
            <div class="am-label">年化收益</div>
          </div>
          <div class="am-card">
            <div class="am-val loss">-{{ (attrResult.maxDrawdown || 0).toFixed(2) }}%</div>
            <div class="am-label">最大回撤</div>
          </div>
          <div class="am-card">
            <div class="am-val">{{ (attrResult.sharpe || 0).toFixed(2) }}</div>
            <div class="am-label">夏普比率</div>
          </div>
          <div class="am-card">
            <div class="am-val">{{ (attrResult.winRate || 0).toFixed(0) }}%</div>
            <div class="am-label">胜率</div>
          </div>
        </div>

        <!-- 领导层一句话总结 -->
        <div class="attr-summary" v-if="attrResult.summary">
          <span class="as-icon">📋</span>
          <span class="as-text">{{ attrResult.summary }}</span>
        </div>

        <!-- 四维度归因卡片 -->
        <div class="attr-dimensions">
          <div class="ad-card market-card">
            <div class="ad-icon">🌍</div>
            <div class="ad-title">市场环境因素</div>
            <div class="ad-body">{{ attrResult.marketInsight }}</div>
          </div>
          <div class="ad-card driver-card">
            <div class="ad-icon">⚙️</div>
            <div class="ad-title">策略特性归因</div>
            <div class="ad-body">{{ attrResult.strategyDriver }}</div>
          </div>
          <div class="ad-card risk-card">
            <div class="ad-icon">📉</div>
            <div class="ad-title">风险收益解读</div>
            <div class="ad-body">{{ attrResult.riskRewardAnalysis }}</div>
          </div>
          <div class="ad-card value-card">
            <div class="ad-icon">💡</div>
            <div class="ad-title">配置价值与建议</div>
            <div class="ad-body">{{ attrResult.configValue }}</div>
          </div>
        </div>

        <!-- 风险提示 -->
        <div class="attr-warning" v-if="attrResult.riskWarning">
          <span class="aw-icon">⚠️</span>
          <span class="aw-text">{{ attrResult.riskWarning }}</span>
        </div>

        <div class="attr-actions">
          <button class="ab-regen" @click="loadAttr">
            🔄 重新分析
          </button>
        </div>
      </div>

      <!-- 归因方法说明（始终显示） -->
      <div class="attr-methodology" v-if="attrResult && !attrLoading">
        <div class="am-header">
          <span class="am-icon">📖</span>
          <span class="am-title">归因方法说明</span>
        </div>
        <div class="am-body">
          <div class="am-row">
            <div class="am-label">分析维度</div>
            <div class="am-content">基于策略的历史净值指标（年化收益、波动率、最大回撤、夏普比率等）进行特征画像，结合行业通用的策略分类逻辑，由 AI 生成符合行业惯例的解读文本。</div>
          </div>
          <div class="am-row">
            <div class="am-label">数据基础</div>
            <div class="am-content">本示例中的策略数据为模拟数据，用于演示目的。真实场景下，系统可对接光大资管的实际净值数据与持仓数据。</div>
          </div>
          <div class="am-row">
            <div class="am-label">方法定位</div>
            <div class="am-content">本分析为<strong>策略画像解读</strong>，而非严格的业绩归因（Brinson 模型等）。真正的持仓归因需要持仓明细、行业配置权重等底层数据支持。</div>
          </div>
          <div class="am-row">
            <div class="am-label">免责声明</div>
            <div class="am-content">AI 生成内容仅供参考，不构成投资建议。历史业绩不代表未来表现，投资有风险，决策需谨慎。</div>
          </div>
        </div>
      </div>

      <!-- 未加载状态 -->
      <div class="attr-start" v-if="strategy && !attrResult && !attrLoading">
        <div class="as-icon">🔬</div>
        <div class="as-title">AI 归因分析</div>
        <div class="as-sub">点击上方周期按钮，AI 将从市场环境、策略特性、风险收益、配置价值四个维度深度解读本策略的表现驱动因素</div>
        <button class="as-btn" @click="loadAttr">
          🚀 启动分析
        </button>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 合规风险提示 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="risk-disclosure">
      <div class="rd-icon">⚠️</div>
      <div class="rd-content">
        <div class="rd-title">风险提示与免责声明</div>
        <div class="rd-text">
          本页面所展示的策略信息及历史业绩数据仅供参考，不构成光大资管对任何投资者的投资建议或投资邀约。<strong>历史业绩不代表未来表现</strong>，各策略过往业绩及业绩比较基准的历史数据不预示其未来回报。投资有风险，投资者应充分了解产品风险收益特征，根据自身的投资目的、投资期限、投资经验、资产状况等因素，审慎做出投资决策。如需了解具体产品信息，请参阅相关产品说明书、风险揭示书及法律文件，或联系您的专属客户经理。
        </div>
        <div class="rd-meta">光大资管 · 产品研究平台 · 仅供内部参考</div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 操作按钮 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="action-row">
      <button class="action-btn primary" @click="startAIChat">
        <span class="ai-icon">💬</span>AI 解读这个策略
      </button>
      <button class="action-btn secondary" @click="router.push('/products')">
        ← 返回策略目录
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStrategy, getStrategyTimeSeries, type StrategyItem, type TimeSeriesPoint } from '../services/strategy'
import { useChatStore } from '../stores/chat'
import type { StrategyContext } from '../types/chat'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()

const strategy = ref<StrategyItem | null>(null)
const loading = ref(false)
const error = ref('')
const chartRef = ref<HTMLElement>()

// 归因分析
const attrPeriod = ref('month')
const attrResult = ref<any>(null)
const attrLoading = ref(false)
const attrPeriods = [
  { key: 'week', label: '近一周' },
  { key: 'month', label: '近一月' },
  { key: 'quarter', label: '近一季' },
  { key: 'year', label: '近一年' },
]
let chartInstance: echarts.ECharts | null = null
const timeSeries = ref<TimeSeriesPoint[]>([])

const periods = [
  { key: 'week', label: '近一周' },
  { key: 'month', label: '近一月' },
  { key: 'quarter', label: '近一季' },
  { key: 'year', label: '近一年' },
  { key: 'inception', label: '成立以来' },
]
const activePeriod = ref('inception')

function rnd(n: number | null | undefined, d = 2) { return n == null ? '—' : Number(n.toFixed(d)) }
function fmt(n: number | null | undefined, decimals = 2, prefix = '') {
  if (n == null) return '—'
  const sign = n >= 0 && prefix !== '-' ? '+' : ''
  return `${sign}${prefix}${n.toFixed(decimals)}`
}

function calcMaxDD(vals: number[]) {
  let peak = vals[0] ?? 0, maxDD = 0
  for (const v of vals) { peak = Math.max(peak, v); maxDD = Math.min(maxDD, v - peak) }
  return maxDD
}
function calcVol(vals: number[]) {
  if (!vals.length) return 0
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length)
}

const BENCHMARK_RETS: Record<string, number> = {
  '理财收益': 3.8, '中证800': 5.2, '中证500': 6.1,
  '中证1000': 7.4, '一级债基指数': 4.5, '华安黄金ETF': 6.2,
  '万得偏股混合型基金指数': 8.1,
}
const benchmarkReturn = computed(() => BENCHMARK_RETS[strategy.value?.benchmarkName ?? ''] ?? 4.5)
const excessReturn = computed(() => {
  const ann = strategy.value?.annualReturn
  if (ann == null) return '—'
  const ex = ann - benchmarkReturn.value
  const sign = ex >= 0 ? '+' : ''
  return `${sign}${ex.toFixed(2)}`
})
const winRateYear = computed(() => {
  const wr = strategy.value?.winRate
  if (wr == null) return '—'
  return ((wr / 100) * 5).toFixed(1)
})

function winRateClass(w: number) {
  if (w >= 80) return 'gain'; if (w >= 60) return 'mid'; return 'loss'
}

const chartKpis = computed(() => {
  if (!strategy.value || !timeSeries.value.length) return []
  const prodVals = timeSeries.value.map(p => p.ret ?? 0)
  const bmVals = timeSeries.value.map(p => p.benchmark ?? 0)
  const prodEnd = prodVals.at(-1) ?? 0
  const bmEnd = bmVals.at(-1) ?? 0
  const excess = prodEnd - bmEnd
  const maxDD = Math.abs(calcMaxDD(prodVals))
  const vol = calcVol(prodVals)
  const beat = prodVals.filter((v, i) => v >= bmVals[i]).length / prodVals.length * 100
  const f = (v: number, alwaysSign = false) => `${alwaysSign && v > 0 ? '+' : ''}${v.toFixed(2)}%`
  const items = [
    { label: '区间收益', value: f(prodEnd, true), raw: Math.abs(prodEnd), tone: prodEnd >= 0 ? 'gain' : 'loss' },
    { label: '超额收益', value: f(excess, true), raw: Math.abs(excess), tone: excess >= 0 ? 'gain' : 'loss' },
    { label: '最大回撤', value: f(maxDD), raw: maxDD, tone: 'loss' },
    { label: '波动幅度', value: f(vol), raw: vol, tone: '' },
    { label: '跑赢基准', value: f(beat), raw: beat, tone: beat >= 50 ? 'gain' : 'loss' },
  ]
  const maxRaw = Math.max(...items.map(i => i.raw), 1)
  return items.map(i => ({ ...i, pct: i.raw / maxRaw * 100 }))
})

const compareRows = computed(() => {
  if (!strategy.value) return []
  const annRet = strategy.value?.annualReturn ?? 0
  const bmRet = benchmarkReturn.value
  const prodVals = timeSeries.value.map(p => p.ret ?? 0)
  const bmVals = timeSeries.value.map(p => p.benchmark ?? 0)
  const maxDD = Math.abs(calcMaxDD(prodVals))
  const bmMaxDD = Math.abs(calcMaxDD(bmVals))
  const vol = calcVol(prodVals)
  const bmVol = calcVol(bmVals)
  const beatPct = prodVals.length ? prodVals.filter((v, i) => v >= bmVals[i]).length / prodVals.length * 100 : 0
  const f = (v: number, alwaysSign = false) => `${alwaysSign && v > 0 ? '+' : ''}${v.toFixed(2)}%`
  return [
    { metric: '年化收益', strategyVal: f(annRet, true), benchmarkVal: f(bmRet, true), diffVal: f(Math.abs(annRet - bmRet), true), diffSign: annRet >= bmRet ? '+' : '-', strategyTone: annRet >= 0 ? 'gain' : 'loss', diffTone: annRet >= bmRet ? 'gain' : 'loss' },
    { metric: '区间收益', strategyVal: f(prodVals.at(-1) ?? 0, true), benchmarkVal: f(bmVals.at(-1) ?? 0, true), diffVal: f(Math.abs((prodVals.at(-1) ?? 0) - (bmVals.at(-1) ?? 0)), true), diffSign: (prodVals.at(-1) ?? 0) >= (bmVals.at(-1) ?? 0) ? '+' : '-', strategyTone: (prodVals.at(-1) ?? 0) >= 0 ? 'gain' : 'loss', diffTone: (prodVals.at(-1) ?? 0) >= (bmVals.at(-1) ?? 0) ? 'gain' : 'loss' },
    { metric: '最大回撤', strategyVal: f(maxDD), benchmarkVal: f(bmMaxDD), diffVal: f(Math.abs(maxDD - bmMaxDD)), diffSign: maxDD <= bmMaxDD ? '-' : '+', strategyTone: 'loss', diffTone: maxDD <= bmMaxDD ? 'gain' : 'loss' },
    { metric: '波动幅度', strategyVal: f(vol), benchmarkVal: f(bmVol), diffVal: f(Math.abs(vol - bmVol)), diffSign: vol <= bmVol ? '-' : '+', strategyTone: '', diffTone: vol <= bmVol ? 'gain' : 'loss' },
    { metric: '跑赢基准', strategyVal: f(beatPct), benchmarkVal: '50.00%', diffVal: f(Math.abs(beatPct - 50)), diffSign: beatPct >= 50 ? '+' : '-', strategyTone: beatPct >= 50 ? 'gain' : 'loss', diffTone: beatPct >= 50 ? 'gain' : 'loss' },
  ]
})

const suitableTags = computed(() => {
  if (!strategy.value) return []
  const tags = strategy.value.tags || []
  const pos = strategy.value.positioning || ''
  const result: string[] = []
  if (tags.some(t => t.includes('稳健') || t.includes('绝对') || t.includes('低波'))) result.push('稳健型客户', '保守型客户')
  if (tags.some(t => t.includes('相对收益') || t.includes('增强'))) result.push('机构客户', '积极型客户')
  if (tags.some(t => t.includes('红利') || t.includes('低波'))) result.push('养老资金', '低风险偏好')
  if (pos.includes('熊市') || pos.includes('下跌')) result.push('看空保护需求')
  if (pos.includes('高波动') || pos.includes('beta')) result.push('高风险承受型')
  if (!result.length) result.push('各类投资者通用')
  return [...new Set(result)].slice(0, 5)
})
const notSuitableTags = ['需要绝对保本的资金安排', '流动性要求极高的资金', '短期资金安排']

// ── 图表 ──────────────────────────────────────────────────────────
function renderChart() {
  if (!chartRef.value || !strategy.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  const dates = timeSeries.value.map(p => p.date)
  const prodVals = timeSeries.value.map(p => p.ret ?? 0)
  const bmVals = timeSeries.value.map(p => p.benchmark ?? 0)
  chartInstance.setOption({
    backgroundColor: 'transparent',
    animation: true,
    grid: { top: 40, left: 56, right: 20, bottom: 44 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,252,246,0.96)',
      borderColor: 'rgba(23,55,91,0.15)',
      textStyle: { color: '#19324a' },
    },
    xAxis: {
      type: 'category', boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(23,55,91,0.15)' } },
      axisLabel: {
        color: '#6d7c8d', margin: 12,
        formatter: (v: string, i: number) => i % Math.ceil(dates.length / 6) === 0 ? v : ''
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6d7c8d', formatter: '{value}%' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(23,55,91,0.08)' } },
    },
    series: [
      {
        name: strategy.value!.name,
        type: 'line', smooth: true, symbol: 'none',
        data: prodVals,
        lineStyle: { width: 3, color: '#d0680a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(208,104,10,0.22)' },
            { offset: 1, color: 'rgba(208,104,10,0.01)' },
          ]),
        },
      },
      {
        name: strategy.value!.benchmarkName,
        type: 'line', smooth: true, symbol: 'none',
        data: bmVals,
        lineStyle: { width: 2.5, color: '#3a7fbf' },
      },
    ],
  }, true)
}

async function fetchTimeSeries(period: string) {
  const id = String(route.params.id || '')
  try {
    const ts = await getStrategyTimeSeries(id, period)
    timeSeries.value = ts.data || []
  } catch {
    timeSeries.value = []
  }
}

async function switchPeriod(key: string) {
  activePeriod.value = key
  await fetchTimeSeries(key)
  renderChart()
}

async function loadStrategy() {
  const id = String(route.params.id || '')
  loading.value = true
  error.value = ''
  try {
    const s = await getStrategy(id)
    if (!s || Object.keys(s).length === 0) {
      error.value = `未找到策略 ${id}，请检查编号是否正确`
      strategy.value = null
      return
    }
    strategy.value = s
    await fetchTimeSeries(activePeriod.value)
  } catch (e: any) {
    error.value = e?.message || '策略加载失败，请检查编号是否正确'
    strategy.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadStrategy()
  await nextTick()
  renderChart()
  window.addEventListener('resize', () => chartInstance?.resize())
})

onUnmounted(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', () => chartInstance?.resize())
})

function startAIChat() {
  if (!strategy.value) return
  const ctx: StrategyContext = {
    id: String(strategy.value.seed),
    name: strategy.value.name,
    productLine: strategy.value.navCategory,
    strategy: strategy.value.logicSummary,
    suitableFor: suitableTags.value,
    notSuitableFor: notSuitableTags,
    standardRiskNotice: '策略展示数据仅供内部演示与交流，不构成收益承诺。'
  }
  chatStore.resetChat()
  chatStore.setMode('strategy_intro')
  chatStore.setSelectedStrategy(ctx)
  chatStore.setMessages([
    { role: 'assistant', content: `可以，我来为你解读"${ctx.name}"这个策略。` },
    { role: 'user', content: '这个策略适合我吗？它的核心逻辑是什么？' }
  ])
  router.push('/chat')
}

async function loadAttr() {
  if (!strategy.value || attrLoading.value) return
  attrLoading.value = true
  attrResult.value = null
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003'

    // 优先 AI 归因（35秒超时），失败则降级到规则引擎
    const aiResp = await fetch(`${base}/api/attribution/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(180000),
      body: JSON.stringify({
        strategy: {
          name: strategy.value.name,
          navCategory: strategy.value.navCategory,
          annualReturn: strategy.value.annualReturn,
          winRate: strategy.value.winRate,
          maxDrawdown: (strategy.value as any).maxDrawdown,
          volatility: (strategy.value as any).volatilityValue,
          sharpe: (strategy.value as any).sharpe,
          riskLevel: (strategy.value as any).riskLevel || 'R3',
          investmentHorizon: (strategy.value as any).investmentHorizon || 'medium_term',
          logicSummary: strategy.value.logicSummary,
          tags: strategy.value.tags || [],
        },
        period: attrPeriods.find(p => p.key === attrPeriod.value)?.label || '近一月',
      }),
    })
    const aiData = await aiResp.json()
    if (aiResp.ok && aiData.success) {
      attrResult.value = aiData.data || aiData
    } else {
      // AI 失败，降级到规则引擎
      const fallbackResp = await fetch(`${base}/api/attribution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: {
            name: strategy.value.name,
            navCategory: strategy.value.navCategory,
            annualReturn: strategy.value.annualReturn,
            winRate: strategy.value.winRate,
            maxDrawdown: (strategy.value as any).maxDrawdown,
            volatility: (strategy.value as any).volatilityValue,
            sharpe: (strategy.value as any).sharpe,
            riskLevel: (strategy.value as any).riskLevel || 'R3',
            investmentHorizon: (strategy.value as any).investmentHorizon || 'medium_term',
            logicSummary: strategy.value.logicSummary,
            tags: strategy.value.tags || [],
          },
          period: attrPeriods.find(p => p.key === attrPeriod.value)?.label || '近一月',
        }),
      })
      const fallbackData = await fallbackResp.json()
      attrResult.value = fallbackData.data || fallbackData
    }
  } catch {
    attrResult.value = { analysis: '（归因分析暂时不可用）', strategyName: strategy.value?.name, period: attrPeriods.find(p => p.key === attrPeriod.value)?.label, periodReturn: strategy.value?.annualReturn || 0 }
  } finally {
    attrLoading.value = false
  }
}
</script>

<style scoped>
.detail-page { display: flex; flex-direction: column; gap: 20px; min-height: calc(100vh - 88px); box-sizing: border-box; }

/* 卡片基础 */
.card {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 24px rgba(41, 61, 84, 0.1);
  border-radius: 20px;
  padding: 20px 16px;
}
.section-eyebrow { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.section-heading { margin: 0 0 20px; font-size: 22px; font-weight: 700; color: var(--text); }

/* 面包屑 */
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); padding: 0 0 4px; }
.bc-item { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 13px; }
.bc-item:hover { color: var(--blue); }
.bc-sep { color: rgba(23,55,91,0.3); }
.bc-current { color: var(--muted); }
.bc-current.bold { color: var(--text); font-weight: 600; }

/* 主标题区 */
.detail-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 32px; align-items: start; }
.head-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.cat-badge { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; background: var(--blue); padding: 3px 12px; border-radius: 999px; }
.strategy-id { font-size: 12px; color: var(--muted); }
.stars-row { display: flex; gap: 1px; font-size: 14px; }
.star { color: rgba(23,55,91,0.15); }
.star.filled { color: var(--gold); }
.strategy-name { margin: 0 0 8px; font-size: 34px; font-weight: 700; color: var(--text); line-height: 1.2; }
.owner-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); margin-bottom: 12px; }
.owner-icon { font-size: 13px; }
.dot { color: rgba(23,55,91,0.2); }
.tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 12px; padding: 3px 10px; border-radius: 6px; background: rgba(23,55,91,0.07); border: 1px solid rgba(23,55,91,0.12); color: var(--text); }

/* KPI */
.head-kpis { display: flex; align-items: center; background: rgba(255,252,246,0.9); border: 1px solid rgba(23,55,91,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(23,55,91,0.08); }
.kpi-card { padding: 18px 22px; text-align: center; min-width: 110px; }
.kpi-num { font-size: 26px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; line-height: 1; }
.kpi-num.gain { color: #c24a00; }
.kpi-num.loss { color: #b82020; }
.kpi-num.mid { color: #9e722e; }
.kpi-num.neutral { color: var(--text); font-size: 18px; }
.kpi-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 5px; }
.kpi-sub { font-size: 11px; margin-top: 3px; }
.kpi-sub.gain { color: #c24a00; }
.kpi-sub.loss { color: #b82020; }
.kpi-sub.muted { color: var(--muted); }
.kpi-sep { width: 1px; height: 60px; background: rgba(23,55,91,0.1); flex-shrink: 0; }

/* 图表区 */
.chart-section { }
.chart-toolbar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.chart-heading { margin: 6px 0 0; font-size: 20px; font-weight: 700; color: var(--text); }
.period-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.period-tab { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(23,55,91,0.15); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.period-tab:hover { border-color: var(--blue); color: var(--blue); }
.period-tab.active { background: var(--blue); border-color: var(--blue); color: #fff; }

/* KPI 横条 */
.kpi-bar-row { display: flex; gap: 0; background: rgba(23,55,91,0.04); border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
.kpi-bar-item { flex: 1; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px; border-right: 1px solid rgba(23,55,91,0.07); }
.kpi-bar-item:last-child { border-right: none; }
.kb-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.kb-track { height: 4px; background: rgba(23,55,91,0.1); border-radius: 2px; overflow: hidden; }
.kb-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; min-width: 4px; }
.kb-fill.gain { background: #d0680a; }
.kb-fill.loss { background: #b82020; }
.kb-val { font-size: 13px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.kb-val.gain { color: #c24a00; }
.kb-val.loss { color: #b82020; }

.chart-canvas { height: 280px; }
.chart-legend { display: flex; gap: 24px; margin-top: 10px; justify-content: center; }
.legend-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--muted); }
.legend-dot { width: 14px; height: 3px; border-radius: 2px; }
.strategy-dot { background: #d0680a; }
.benchmark-dot { background: #3a7fbf; }

/* 对比表 */
.compare-table { border: 1px solid rgba(23,55,91,0.1); border-radius: 12px; overflow: hidden; }
.ct-row { display: grid; grid-template-columns: 1.2fr 1fr 1fr 0.7fr; }
.ct-row.header { background: rgba(23,55,91,0.05); }
.ct-row:not(.header):nth-child(even) { background: rgba(23,55,91,0.025); }
.ct-cell { padding: 13px 16px; font-size: 14px; display: flex; align-items: center; }
.col-metric { color: var(--muted); }
.col-strategy { font-weight: 600; color: var(--text); }
.col-benchmark { color: var(--muted); }
.col-diff { }
.ct-val { font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.ct-val.gain { color: #c24a00; }
.ct-val.loss { color: #b82020; }
.ct-diff { font-size: 13px; font-weight: 600; padding: 2px 8px; border-radius: 6px; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.ct-diff.gain { color: #c24a00; background: rgba(208,104,10,0.1); }
.ct-diff.loss { color: #b82020; background: rgba(184,32,32,0.1); }

/* 人群 */
.crowd-intro { font-size: 14px; color: var(--muted); line-height: 1.8; margin: 12px 0 20px; }
.suitable-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.suitable-block { padding: 16px 20px; border-radius: 12px; }
.ok-block { background: rgba(208,104,10,0.06); border: 1px solid rgba(208,104,10,0.2); }
.no-block { background: rgba(184,32,32,0.06); border: 1px solid rgba(184,32,32,0.2); }
.sb-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
.ok-block .sb-title { color: #c24a00; }
.no-block .sb-title { color: #b82020; }
.sb-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.stag { font-size: 12px; padding: 4px 12px; border-radius: 999px; }
.ok-block .stag { background: rgba(208,104,10,0.12); color: #9e4800; }
.no-block .stag { background: rgba(184,32,32,0.1); color: #b82020; }

/* 逻辑 */
.logic-text { margin-top: 14px; font-size: 14px; line-height: 2; color: var(--text); white-space: pre-wrap; }
.logic-disclaimer { margin-top: 14px; padding: 8px 14px; border-radius: 8px; background: rgba(158,124,46,0.1); border: 1px solid rgba(158,124,46,0.25); color: var(--gold); font-size: 12px; display: inline-block; }

/* 操作 */
.action-row { display: flex; gap: 12px; flex-wrap: wrap; }
.action-btn { display: flex; align-items: center; gap: 8px; padding: 12px 26px; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; border: none; }
.action-btn.primary { background: var(--blue); color: #fff; }
.action-btn.primary:hover { background: #0f2d52; }
.action-btn.secondary { background: rgba(23,55,91,0.08); color: var(--text); border: 1px solid rgba(23,55,91,0.15); }
.action-btn.secondary:hover { background: rgba(23,55,91,0.14); }
.ai-icon { font-size: 16px; }

/* 全局变量覆盖（浅色主题） */
.gain { color: #c24a00 !important; }
.loss { color: #b82020 !important; }
.mid { color: #9e722e !important; }
.neutral { color: var(--text) !important; }

@media (max-width: 1024px) {
  .detail-head { grid-template-columns: 1fr; }
  .head-kpis { align-self: start; }
  .compare-table .ct-row { grid-template-columns: 1fr 1fr 1fr 0.6fr; }
  .suitable-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .detail-head { padding: 20px; }
  .kpi-bar-row { flex-wrap: wrap; }
  .kpi-bar-item { min-width: 50%; }
  .compare-table .ct-row { grid-template-columns: 1fr 1fr; }
  .compare-table .header { display: none; }
  .ct-row { gap: 0; }
  .head-kpis { flex-direction: column; }
  .kpi-sep { width: 100%; height: 1px; }
}

/* 合规风险提示 */
.risk-disclosure {
  display: flex; gap: 14px;
  padding: 18px 20px;
  background: rgba(23,55,91,0.04);
  border: 1px solid rgba(23,55,91,0.1);
  border-radius: 14px;
  margin-top: 8px;
}
.rd-icon { font-size: 22px; flex-shrink: 0; padding-top: 2px; }
.rd-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.rd-title { font-size: 13px; font-weight: 700; color: var(--text); }
.rd-text { font-size: 12px; color: var(--muted); line-height: 1.85; }
.rd-text strong { color: var(--text); font-weight: 600; }
.rd-meta { font-size: 11px; color: rgba(23,55,91,0.4); padding-top: 4px; border-top: 1px solid rgba(23,55,91,0.06); }

/* ── 归因分析 ── */
.attr-section { padding: 22px; }

.attr-periods { margin: 12px 0 0; }
.ap-hint { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.ap-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.ap-tab { padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(23,55,91,0.15); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.ap-tab:hover { border-color: var(--gold); color: var(--gold); }
.ap-tab.active { border-color: var(--gold); background: rgba(158,114,46,0.1); color: var(--gold); font-weight: 700; }

.attr-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; }
.spinner-ring { width: 36px; height: 36px; border: 3px solid rgba(158,114,46,0.15); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.al-text { font-size: 13px; color: var(--muted); }

.attr-body { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }

/* 顶部指标行 */
.attr-metrics-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.am-card { flex: 1; min-width: 80px; padding: 12px 10px; border-radius: 10px; background: rgba(23,55,91,0.04); text-align: center; }
.am-val { font-size: 20px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',sans-serif; line-height: 1; }
.am-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }

/* 领导层总结 */
.attr-summary { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 10px; background: rgba(23,55,91,0.06); border: 1px solid rgba(23,55,91,0.1); }
.as-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.as-text { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.7; }

/* 四维度卡片 */
.attr-dimensions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.ad-card { padding: 14px 16px; border-radius: 12px; border: 1.5px solid; }
.market-card { background: rgba(88,199,255,0.05); border-color: rgba(88,199,255,0.2); }
.driver-card { background: rgba(139,92,246,0.05); border-color: rgba(139,92,246,0.2); }
.risk-card { background: rgba(248,113,113,0.05); border-color: rgba(248,113,113,0.2); }
.value-card { background: rgba(74,222,128,0.05); border-color: rgba(74,222,128,0.2); }
.ad-icon { font-size: 18px; margin-bottom: 6px; }
.ad-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.ad-body { font-size: 12px; color: var(--muted); line-height: 1.85; }

/* 风险提示 */
.attr-warning { display: flex; align-items: flex-start; gap: 8px; padding: 10px 14px; border-radius: 8px; background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.15); }
.aw-icon { font-size: 15px; flex-shrink: 0; }
.aw-text { font-size: 12px; color: #d97706; line-height: 1.7; }

/* 操作行 */
.attr-actions { display: flex; justify-content: flex-end; }
.ab-regen { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(23,55,91,0.15); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.ab-regen:hover { border-color: var(--blue); color: var(--blue); }

/* 归因方法说明 */
.attr-methodology { margin-top: 18px; padding: 16px 18px; border-radius: 12px; background: rgba(23,55,91,0.04); border: 1.5px dashed rgba(23,55,91,0.12); }
.am-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.am-icon { font-size: 16px; }
.am-title { font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
.am-body { display: flex; flex-direction: column; gap: 10px; }
.am-row { display: flex; gap: 14px; align-items: flex-start; }
.am-label { font-size: 12px; font-weight: 700; color: var(--blue); min-width: 72px; flex-shrink: 0; }
.am-content { font-size: 12px; color: var(--muted); line-height: 1.75; }

.attr-start { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 20px; text-align: center; }
.as-icon { font-size: 42px; }
.as-title { font-size: 18px; font-weight: 700; color: var(--text); }
.as-sub { font-size: 13px; color: var(--muted); line-height: 1.7; max-width: 480px; }
.as-btn { margin-top: 8px; padding: 10px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg,#9e722e,#c24a00); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.as-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(158,114,46,0.3); }

@media (max-width: 600px) {
  .attr-dimensions { grid-template-columns: 1fr; }
}


/* 策略定位标签 */
.strategy-position-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.ptag {
  font-size: 11.5px; padding: 3px 10px; border-radius: 999px; font-weight: 600;
  border: 1px solid; letter-spacing: 0.02em;
}
.ptag.risk.risk-R1 { color: #166534; border-color: #22c55e; background: rgba(34,197,94,0.08); }
.ptag.risk.risk-R2 { color: #1e40af; border-color: #3b82f6; background: rgba(59,130,246,0.08); }
.ptag.risk.risk-R3 { color: #92400e; border-color: #f59e0b; background: rgba(245,158,11,0.08); }
.ptag.risk.risk-R4 { color: #9f1239; border-color: #f43f5e; background: rgba(244,63,94,0.08); }
.ptag.risk.risk-R5 { color: #581c87; border-color: #a855f7; background: rgba(168,85,247,0.08); }
.ptag.horizon { color: var(--blue); border-color: rgba(23,55,91,0.2); background: rgba(23,55,91,0.06); }
.ptag.cat { color: #6b4226; border-color: rgba(107,66,38,0.2); background: rgba(107,66,38,0.06); }
.ptag.liquidity { color: var(--muted); border-color: rgba(23,55,91,0.12); background: rgba(23,55,91,0.04); }

</style>
