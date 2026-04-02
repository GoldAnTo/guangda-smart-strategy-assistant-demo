<template>
  <div class="page-shell rec-page">

    <!-- ═══════════════════════════════════════════════ -->
    <!-- AI 推荐区域（当从偏好分析页跳转时有内容） -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="ai-rec-section card" v-if="hasProfile">

      <div class="ai-rec-header">
        <div class="section-eyebrow">AI Portfolio recommendation</div>
        <div class="ai-rec-actions">
          <button v-if="!recLoading && !recResult?.recommended?.length" class="ai-rec-btn" @click="loadAIRecommendations" :disabled="recLoading">
            🚀 基于您的偏好生成推荐
          </button>
          <button v-if="recResult?.recommended?.length" class="ai-rec-btn refresh" @click="loadAIRecommendations" :disabled="recLoading">
            {{ recLoading ? '分析中...' : '🔄 重新生成' }}
          </button>
        </div>
      </div>

      <!-- 加载中 -->
      <div class="rec-loading" v-if="recLoading">
        <span class="spin-ring"></span>
        <span>AI 正在根据您的偏好匹配最优策略...</span>
      </div>

      <!-- 推荐结果 -->
      <div class="rec-result" v-if="!recLoading && recResult">

        <!-- 升级提示 -->
        <div class="escalation-tip" v-if="recResult.shouldEscalate">
          <div class="et-icon">⚠️</div>
          <div class="et-body">
            <div class="et-title">{{ recResult.escalationReason || '您的需求较特殊' }}</div>
            <div class="et-action">{{ recResult.nextAction || '建议联系客户经理进一步沟通' }}</div>
          </div>
        </div>

        <!-- AI 推荐策略列表 -->
        <div class="rec-list" v-if="recResult.recommended?.length">
          <div class="rec-list-title">
            根据您的偏好，AI 为您匹配了 <strong>{{ recResult.recommended.length }}</strong> 条策略：
          </div>
          <div class="rec-items">
            <div
              v-for="(item, i) in recResult.recommended"
              :key="item.id"
              class="rec-item"
            >
              <div class="ri-rank">{{ i + 1 }}</div>
              <div class="ri-info">
                <div class="ri-name">{{ item.name }}</div>
                <div class="ri-cat">{{ item.navCategory }}</div>
              </div>
              <div class="ri-match">
                <div class="ri-matchscore" :style="{ color: matchColor(item.matchScore) }">{{ (item.matchScore * 100).toFixed(0) }}%</div>
                <div class="ri-matchlab">匹配度</div>
              </div>
              <div class="ri-metrics">
                <span class="rim ret" :class="item.annualReturn >= 0 ? 'gain' : 'loss'">
                  {{ item.annualReturn >= 0 ? '+' : '' }}{{ item.annualReturn?.toFixed(2) }}%
                </span>
              </div>
              <button
                class="ri-add"
                :class="{ added: isSelected(item.id) }"
                @click="addStrategyById(item)"
              >
                {{ isSelected(item.id) ? '✓ 已添加' : '+ 添加' }}
              </button>
            </div>
          </div>

          <!-- AI 解读 -->
          <div class="rec-explanation" v-if="explanation && !expLoading">
            <div class="exp-title">AI 推荐解读</div>
            <div class="exp-body">{{ explanation }}</div>
          </div>
          <div class="exp-loading" v-if="expLoading">
            <span class="spin-ring-sm"></span> AI 生成解读中...
          </div>
          <button class="exp-regen" v-if="!expLoading && recResult.recommended.length" @click="loadExplanation">
            🔄 重新生成解读
          </button>
        </div>

      </div>

      <!-- 未加载 -->
      <div class="rec-idle" v-if="!recLoading && !recResult">
        <div class="ri-idle-hint">点击上方按钮，基于您输入的投资偏好，AI 将从全量策略库中筛选最适合您的配置方案</div>
      </div>

    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 顶部标题 -->
    <!-- ═══════════════════════════════════════════════ -->
    <header class="rec-header">
      <div>
        <div class="eyebrow">Portfolio configurator</div>
        <h1>组合配置器</h1>
        <p class="page-lead">选择策略、分配权重，实时看组合的模拟收益与风险。</p>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 主布局 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="rec-layout">

      <!-- 左侧：策略库 -->
      <aside class="strategy-library card">
        <div class="lib-head">
          <div class="section-eyebrow">Strategy library</div>
          <div class="lib-count">{{ allStrategies.length }} 条策略</div>
        </div>

        <!-- 分类过滤 -->
        <div class="cat-filter">
          <button
            v-for="cat in categories"
            :key="cat.name"
            class="cat-btn"
            :class="{ active: activeCat === cat.name }"
            @click="activeCat = activeCat === cat.name ? '' : cat.name"
          >{{ cat.name }} <span class="cat-num">{{ cat.count }}</span></button>
        </div>

        <!-- 搜索 -->
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="searchText" class="search-input" placeholder="搜索策略名称..." />
        </div>

        <!-- 策略列表 -->
        <div class="lib-list">
          <button
            v-for="s in filteredStrategies"
            :key="s.seed"
            class="lib-item"
            :class="{ selected: isSelected(s.seed) }"
            @click="addStrategy(s)"
          >
            <div class="lib-item-left">
              <div class="lib-check">
                <svg v-if="isSelected(s.seed)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="lib-item-info">
                <div class="lib-item-name">{{ s.name }}</div>
                <div class="lib-item-cat">{{ s.navCategory }}</div>
              </div>
            </div>
            <div class="lib-item-metric">
              <div class="lib-ret" :class="s.annualReturn >= 0 ? 'gain' : 'loss'">
                {{ fmt(s.annualReturn) }}%
              </div>
              <div class="lib-ret-label">年化</div>
            </div>
          </button>
        </div>
      </aside>

      <!-- 右侧：配置区 -->
      <div class="config-area">

        <!-- 空状态 -->
        <div v-if="selected.length === 0" class="empty-state card">
          <div class="empty-icon">🎯</div>
          <div class="empty-title">从左侧选择策略开始配置</div>
          <div class="empty-sub">点击策略添加到组合，然后调整各策略的权重</div>
        </div>

        <!-- 已选策略 + 权重配置 -->
        <template v-else>
          <!-- 已选标签栏 -->
          <div class="selected-bar card">
            <div class="selected-bar-head">
              <div class="section-eyebrow">Selected</div>
              <button class="clear-all-btn" @click="clearAll">清空全部</button>
            </div>
            <div class="selected-chips">
              <div
                v-for="item in selected"
                :key="item.seed"
                class="selected-chip"
                :style="{ borderColor: getColor(item.seed) }"
              >
                <div class="chip-dot" :style="{ background: getColor(item.seed) }"></div>
                <span class="chip-name">{{ item.name }}</span>
                <button class="chip-remove" @click="removeStrategy(item.seed)">×</button>
              </div>
            </div>
          </div>

          <!-- 权重分配 -->
          <div class="allocations-section card">
            <div class="section-eyebrow">Weight allocation</div>
            <h2 class="section-heading">分配权重</h2>

            <!-- 权重滑块 -->
            <div class="slider-list">
              <div v-for="item in selected" :key="item.seed" class="slider-row">
                <div class="slider-label">
                  <div class="slider-dot" :style="{ background: getColor(item.seed) }"></div>
                  <div class="slider-info">
                    <div class="slider-name">{{ item.name }}</div>
                    <div class="slider-cat">{{ item.navCategory }}</div>
                  </div>
                </div>
                <div class="slider-control">
                  <input
                    type="range"
                    class="weight-slider"
                    :value="allocations[item.seed] || 0"
                    min="0"
                    max="100"
                    step="1"
                    @input="updateWeight(item.seed, ($event.target as HTMLInputElement).value)"
                  />
                  <div class="weight-value" :style="{ color: getColor(item.seed) }">
                    {{ allocations[item.seed] || 0 }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- 总权重提示 -->
            <div class="total-weight-row" :class="weightValid ? 'valid' : 'invalid'">
              <span>总权重：<strong>{{ totalWeight }}%</strong></span>
              <span v-if="!weightValid" class="weight-hint">
                <span v-if="remainingWeight > 0">还差 {{ remainingWeight }}% 未分配</span>
                <span v-else>超出 {{ totalWeight - 100 }}%</span>
              </span>
              <span v-else class="weight-hint-ok">✓ 权重合计 100%</span>
              <button
                v-if="!weightValid && selected.length > 0 && remainingWeight > 0"
                class="balance-btn"
                @click="balanceWeights"
              >自动填满</button>
            </div>
          </div>

          <!-- 生成模拟按钮 -->
          <div class="simulate-cta" v-if="selected.length > 0 && weightValid">
            <button class="simulate-btn" @click="calculate" :disabled="simulating">
              <span v-if="!simulating">🚀 生成组合模拟</span>
              <span v-else class="simulating-text"><span class="spin-ring-xs"></span> 模拟中...</span>
            </button>
            <button v-if="selected.length >= 2" class="mc-btn" @click="runMonteCarlo" :disabled="mcRunning">
              <span v-if="!mcRunning">🎲 蒙特卡洛模拟</span>
              <span v-else class="simulating-text"><span class="spin-ring-xs"></span> 模拟中...</span>
            </button>
          </div>

          <!-- 模拟结果 -->
          <div v-if="result" class="result-section card">
            <div class="section-eyebrow">Portfolio metrics</div>
            <h2 class="section-heading">组合模拟指标</h2>

            <!-- 大数字 -->
            <div class="portfolio-kpis">
              <div class="pkpi-card">
                <div class="pkpi-label">组合年化收益</div>
                <div class="pkpi-val" :class="result!.portfolioReturn >= 0 ? 'gain' : 'loss'">
                  {{ fmt(result!.portfolioReturn) }}%
                </div>
                <div class="pkpi-compare" v-if="selected.length > 1">
                  vs 简单平均 {{ fmt(simpleAvgReturn, 2, false) }}%
                </div>
              </div>
              <div class="pkpi-card">
                <div class="pkpi-label">模拟波动率</div>
                <div class="pkpi-val">{{ fmt(result!.portfolioVolatility, 2, false) }}%</div>
                <div class="pkpi-compare" v-if="selected.length > 1">
                  vs 简单平均 {{ fmt(simpleAvgVol, 2, false) }}%
                </div>
              </div>
              <div class="pkpi-card">
                <div class="pkpi-label">模拟最大回撤</div>
                <div class="pkpi-val loss">-{{ fmt(result!.portfolioMaxDrawdown, 2, false) }}%</div>
              </div>
              <div class="pkpi-card">
                <div class="pkpi-label">夏普比率</div>
                <div class="pkpi-val" :class="result!.portfolioSharpe >= 1 ? 'gain' : ''">
                  {{ fmt(result!.portfolioSharpe, 2, false) }}
                </div>
              </div>
            </div>

            <!-- 分散化效果 -->
            <div v-if="selected.length > 1" class="diversification-box">
              <div class="div-title">📊 分散化效果</div>
              <div class="div-desc">
                通过组合 {{ selected.length }} 条策略，波动率从简单平均的
                <strong>{{ fmt(simpleAvgVol, 1, false) }}%</strong>
                降低至 <strong>{{ fmt(result!.portfolioVolatility, 1, false) }}%</strong>
                （降低约 {{ fmt(diversificationEffect, 1, false) }}%），
                {{ diversificationEffect > 0 ? '体现了组合分散化的价值' : '注意相关性较高的策略可能增加组合风险' }}。
              </div>
            </div>

            <!-- 各成分详情 -->
            <div class="components-table">
              <div class="ct-head" :style="{ gridTemplateColumns: `1fr repeat(${selected.length}, minmax(90px, 1fr))` }">
                <div class="ct-cell col-metric">指标</div>
                <div v-for="item in selected" :key="item.seed" class="ct-cell col-strat">
                  <div class="strat-dot" :style="{ background: getColor(item.seed) }"></div>
                  <div class="strat-name">{{ item.name }}</div>
                </div>
              </div>
              <div class="ct-row" :style="{ gridTemplateColumns: `1fr repeat(${selected.length}, minmax(90px, 1fr))` }">
                <div class="ct-cell col-metric muted">权重</div>
                <div v-for="item in selected" :key="item.seed" class="ct-cell col-strat">
                  <div class="ct-val" :style="{ color: getColor(item.seed) }">{{ allocations[item.seed] || 0 }}%</div>
                </div>
              </div>
              <div class="ct-row" :style="{ gridTemplateColumns: `1fr repeat(${selected.length}, minmax(90px, 1fr))` }">
                <div class="ct-cell col-metric muted">年化收益</div>
                <div v-for="item in selected" :key="item.seed" class="ct-cell col-strat">
                  <div class="ct-val" :class="item.annualReturn >= 0 ? 'gain' : 'loss'">
                    {{ fmt(item.annualReturn) }}%
                  </div>
                </div>
              </div>
              <div class="ct-row" :style="{ gridTemplateColumns: `1fr repeat(${selected.length}, minmax(90px, 1fr))` }">
                <div class="ct-cell col-metric muted">波动率</div>
                <div v-for="item in selected" :key="item.seed" class="ct-cell col-strat">
                  <div class="ct-val">{{ fmt(item.volatility, 2, false) }}%</div>
                </div>
              </div>
              <div class="ct-row" :style="{ gridTemplateColumns: `1fr repeat(${selected.length}, minmax(90px, 1fr))` }">
                <div class="ct-cell col-metric muted">最大回撤</div>
                <div v-for="item in selected" :key="item.seed" class="ct-cell col-strat">
                  <div class="ct-val loss">-{{ fmt(item.maxDrawdown, 2, false) }}%</div>
                </div>
              </div>
            </div>

            <!-- 蒙特卡洛模拟结果 -->
          <div v-if="mcResult" class="mc-section card">
            <div class="section-eyebrow">Monte Carlo simulation</div>
            <div class="mc-header">
              <h2 class="section-heading">蒙特卡洛模拟 · {{ mcResult.numSimulations }} 次随机组合</h2>
              <button class="mc-close" @click="mcResult = null">×</button>
            </div>

            <!-- 散点图 -->
            <div class="mc-chart-wrap">
              <div ref="mcChartRef" class="mc-chart"></div>
            </div>

            <!-- 最优组合推荐 -->
            <div class="mc-optimal" v-if="topOptimal.length">
              <div class="mc-optimal-title">⭐ 最优组合 TOP {{ topOptimal.length }}</div>
              <div class="mc-optimal-list">
                <div v-for="(p, i) in topOptimal" :key="i" class="mc-optimal-item" @click="applyMcWeights(p)">
                  <div class="mo-rank">#{{ i + 1 }}</div>
                  <div class="mo-weights">
                    <span v-for="(w, j) in p.weights" :key="j" class="mo-w-chip" :style="{ borderColor: getColor(selected[j]?.seed) }">
                      {{ mcResult.strategyNames[j] }} {{ w }}%
                    </span>
                  </div>
                  <div class="mo-metrics">
                    <span class="mom ret" :class="p.return >= 0 ? 'gain' : 'loss'">{{ p.return >= 0 ? '+' : '' }}{{ p.return }}%</span>
                    <span class="mom vol">{{ p.volatility }}%</span>
                    <span class="mom sharpe">夏普 {{ p.sharpe }}</span>
                  </div>
                  <button class="mo-apply">应用</button>
                </div>
              </div>
            </div>
          </div>

          <!-- AI 解读 -->
            <div class="ai-interpret card ai-card">
              <div class="ai-head">
                <span class="ai-icon">💬</span>
                <span class="ai-title">AI 组合解读</span>
                <button class="ai-refresh-btn" @click="generateAIInterpretation" :disabled="aiLoading">
                  {{ aiLoading ? '解读中...' : '重新解读' }}
                </button>
              </div>
              <div v-if="aiInterpretation" class="ai-body">{{ aiInterpretation }}</div>
              <div v-else-if="!aiLoading" class="ai-placeholder" @click="generateAIInterpretation">
                点击生成 AI 对此组合的专业解读
              </div>
            </div>
          </div>

          <!-- 权重未达100%时提示 -->
          <div v-else-if="!weightValid" class="weight-warning card">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
              总权重 <strong>{{ totalWeight }}%</strong>，需调整至 100% 即可查看模拟指标。
              当前可用权重：{{ 100 - totalWeight }}%
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { listStrategies, simulatePortfolio, runMonteCarloSimulation, type StrategyItem, type PortfolioResult, type MonteCarloResult, type MonteCarloPoint } from '../services/strategy'
import type { Allocation } from '../services/strategy'
import { matchProducts, generateExplanation } from '../services/recommendation'
import { useDemandStore } from '../stores/demand'
import type { RecommendationItem } from '../types/recommendation'

const demandStore = useDemandStore()
const hasProfile = computed(() => Boolean(demandStore.profile && Object.keys(demandStore.profile).length > 0))

const COLORS = ['#d0680a', '#3a7fbf', '#6abf40', '#c04040', '#8b5cf6', '#d4a017', '#e07020', '#4080c0']

function fmt(v: number | null | undefined, decimals = 2, sign = true): string {
  if (v == null || typeof v !== 'number' || isNaN(v)) return '—'
  return (sign && v >= 0 ? '+' : '') + v.toFixed(decimals)
}

const allStrategies = ref<StrategyItem[]>([])
const selected = ref<StrategyItem[]>([])
const allocations = ref<Record<number, number>>({})
const searchText = ref('')
const activeCat = ref('')
const result = ref<PortfolioResult | null>(null)
const aiInterpretation = ref('')
const aiLoading = ref(false)
const simulating = ref(false)

// Monte Carlo
const mcResult = ref<MonteCarloResult | null>(null)
const mcRunning = ref(false)
const mcChartRef = ref<HTMLElement | null>(null)
const topOptimal = computed(() => mcResult.value?.points.filter(p => p.isOptimal) ?? [])

// AI 推荐状态
const recResult = ref<any>(null)
const recLoading = ref(false)
const explanation = ref('')
const expLoading = ref(false)

async function loadAIRecommendations() {
  if (!demandStore.profile) return
  recLoading.value = true
  recResult.value = null
  explanation.value = null
  try {
    recResult.value = await matchProducts(demandStore.profile)
    if (recResult.value?.recommended?.length && !recResult.value.shouldEscalate) {
      await loadExplanation()
    }
  } catch {
    recResult.value = null
  } finally {
    recLoading.value = false
  }
}

async function loadExplanation() {
  if (!recResult.value) return
  expLoading.value = true
  explanation.value = ''
  try {
    const result = await generateExplanation({
      profile: demandStore.profile,
      recommended: recResult.value.recommended,
      excluded: recResult.value.excluded || [],
    })
    explanation.value = result?.explanation || ''
  } catch {
    explanation.value = ''
  } finally {
    expLoading.value = false
  }
}

function matchColor(score: number) {
  if (score >= 0.85) return '#4ade80'
  if (score >= 0.7) return '#f59e0b'
  return '#f87171'
}

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

const totalWeight = computed(() =>
  selected.value.reduce((sum, s) => sum + (allocations.value[s.seed] || 0), 0)
)
const remainingWeight = computed(() => Math.max(0, 100 - totalWeight.value))
const weightValid = computed(() => Math.abs(totalWeight.value - 100) < 0.1)

const simpleAvgReturn = computed(() => {
  if (!selected.value.length) return 0
  return selected.value.reduce((sum, s) => sum + (s.annualReturn || 0), 0) / selected.value.length
})
const simpleAvgVol = computed(() => {
  if (!selected.value.length) return 0
  return selected.value.reduce((sum, s) => sum + ((s as any).volatilityValue || 0), 0) / selected.value.length
})
const diversificationEffect = computed(() => {
  if (!result.value || simpleAvgVol.value === 0) return 0
  return ((simpleAvgVol.value - result.value.portfolioVolatility) / simpleAvgVol.value) * 100
})

function isSelected(seed: number) {
  return selected.value.some(s => s.seed === seed)
}

function addStrategy(s: StrategyItem) {
  if (isSelected(s.seed)) {
    removeStrategy(s.seed)
    return
  }
  const remaining = remainingWeight.value
  const newCount = selected.value.length + 1
  // Auto-distribute remaining weight evenly
  const autoWeight = Math.floor(remaining / newCount)
  const updated: StrategyItem[] = [...selected.value, s]
  let assigned = 0
  updated.forEach((item, idx) => {
    if (idx === updated.length - 1) {
      // Last item gets the remainder
      allocations.value[item.seed] = remaining - assigned
    } else {
      allocations.value[item.seed] = autoWeight
      assigned += autoWeight
    }
  })
  selected.value = updated
}

// 从 AI 推荐结果添加策略（RecommendationItem → StrategyItem）
function addStrategyById(item: any) {
  const asStrategy: StrategyItem = {
    seed: item.id,
    name: item.name,
    navCategory: item.navCategory,
    category: item.navCategory,
    tags: [],
    annualReturn: item.annualReturn ?? 0,
    winRate: item.winRate ?? 0,
    outlookStars: 3,
    structure: '',
    owner: '',
    logicSummary: '',
    benchmarkName: '',
    positioning: '',
    maxDrawdown: item.maxDrawdown,
    volatilityValue: item.volatilityValue,
    sharpe: item.sharpe,
  }
  addStrategy(asStrategy)
}

function removeStrategy(seed: number) {
  const removedWeight = allocations.value[seed] || 0
  delete allocations.value[seed]
  selected.value = selected.value.filter(s => s.seed !== seed)
  // Re-distribute the freed weight proportionally to remaining items
  const remaining = selected.value.filter(s => allocations.value[s.seed] > 0)
  if (remaining.length > 0 && removedWeight > 0) {
    const addBack = removedWeight / remaining.length
    remaining.forEach(s => {
      allocations.value[s.seed] = Math.round((allocations.value[s.seed] || 0) + addBack)
    })
  }
}

function clearAll() {
  selected.value = []
  allocations.value = {}
  result.value = null
  aiInterpretation.value = ''
}

// Update a single strategy's weight; if total would exceed 100%, clamp the value
function updateWeight(seed: number, value: string) {
  const newWeight = Math.min(100, Math.max(0, parseInt(value, 10) || 0))
  const otherTotal = selected.value
    .filter(s => s.seed !== seed)
    .reduce((sum, s) => sum + (allocations.value[s.seed] || 0), 0)
  const maxAllowed = Math.max(0, 100 - otherTotal)
  allocations.value[seed] = Math.min(newWeight, maxAllowed)
}

function balanceWeights() {
  // Auto-fill remaining weight evenly among all selected strategies
  if (!selected.value.length) return
  const remaining = remainingWeight.value
  if (remaining <= 0) return
  const each = Math.floor(remaining / selected.value.length)
  let assigned = 0
  selected.value.forEach((s, idx) => {
    if (idx === selected.value.length - 1) {
      allocations.value[s.seed] = remaining - assigned
    } else {
      allocations.value[s.seed] = each
      assigned += each
    }
  })
}

function getColor(seed: number) {
  const idx = selected.value.findIndex(s => s.seed === seed)
  return COLORS[idx % COLORS.length]
}

async function calculate() {
  if (!weightValid.value || selected.value.length === 0) return
  simulating.value = true
  const payload: Allocation[] = selected.value.map(s => ({
    strategyId: String(s.seed),
    weight: allocations.value[s.seed] || 0,
  }))
  try {
    result.value = await simulatePortfolio(payload, 'inception')
  } catch {
    result.value = null
  } finally {
    simulating.value = false
  }
}



async function generateAIInterpretation() {
  if (!result.value || selected.value.length === 0) return
  aiLoading.value = true
  aiInterpretation.value = ''
  const strategyNames = selected.value.map(s => s.name).join('、')
  const weights = selected.value.map(s => `${s.name}${allocations.value[s.seed]}%`).join('、')
  const r = result.value
  const rtn = fmt(r.portfolioReturn)
  const vol = fmt(r.portfolioVolatility, 2, false)
  const dd = fmt(r.portfolioMaxDrawdown, 2, false)
  const shp = fmt(r.portfolioSharpe, 2, false)
  const prompt = `你是一位专业的私募资管顾问。请用2-3句话简洁解读以下策略组合的特点和风险提示。

组合构成：${strategyNames}，权重分别为：${weights}。
组合模拟指标：年化收益 ${rtn}%，波动率 ${vol}%，最大回撤 ${dd}%，夏普比率 ${shp}。

请从以下角度解读：1）这个组合的风险收益特征；2）相比单一策略的优势；3）需要注意的风险点。要求语言简洁专业，适合机构客户理解。`

  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003'
    const response = await fetch(`${base}/api/portfolio-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        components: r.components,
        portfolioReturn: r.portfolioReturn,
        portfolioVolatility: r.portfolioVolatility,
        portfolioMaxDrawdown: r.portfolioMaxDrawdown,
        portfolioSharpe: r.portfolioSharpe,
      }),
    })
    const data = await response.json() as Record<string, unknown>
    const content = (data.data as Record<string, string>)?.narrative as string
    aiInterpretation.value = content || '（暂时无法生成解读）'
  } catch {
    aiInterpretation.value = '（AI 解读暂时不可用，请确保 AI 服务已启动）'
  } finally {
    aiLoading.value = false
  }
}



async function runMonteCarlo() {
  if (selected.value.length < 2) return
  mcRunning.value = true
  mcResult.value = null
  try {
    const ids = selected.value.map(s => String(s.seed))
    mcResult.value = await runMonteCarloSimulation(ids, 500)
  } catch {
    mcResult.value = null
  } finally {
    mcRunning.value = false
  }
}

function applyMcWeights(p: MonteCarloPoint) {
  if (!mcResult.value) return
  p.weights.forEach((w, i) => {
    if (selected.value[i]) {
      allocations.value[selected.value[i].seed] = w
    }
  })
  // Trigger recalculation
  calculate()
}

onMounted(async () => {
  allStrategies.value = await listStrategies()
  // 有 profile 时自动加载 AI 推荐
  if (hasProfile.value) {
    await loadAIRecommendations()
  }
}

// Watch mcResult and render ECharts scatter
watch(mcResult, async (val) => {
  if (!val || !mcChartRef.value) return
  await nextTick()
  const echarts = await import('echarts')
  const chart = echarts.init(mcChartRef.value, undefined, { renderer: 'canvas' })

  const points = val.points
  const normalPts = points.filter(p => !p.isOptimal).map(p => [p.volatility, p.return])
  const optimalPts = points.filter(p => p.isOptimal).map(p => [p.volatility, p.return])

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `波动率: ${p.value[0]}%<br/>收益: ${p.value[1]}%`
    },
    xAxis: { name: '波动率 (%)', type: 'value', axisLabel: { formatter: '{value}%' } },
    yAxis: { name: '年化收益 (%)', type: 'value' },
    series: [
      {
        name: '全部组合',
        type: 'scatter',
        data: normalPts,
        symbolSize: 6,
        itemStyle: { color: 'rgba(23,55,91,0.25)', opacity: 0.6 }
      },
      {
        name: '最优组合',
        type: 'scatter',
        data: optimalPts,
        symbolSize: 10,
        itemStyle: { color: '#c24a00', opacity: 1 }
      }
    ],
    legend: { right: 20 },
    grid: { top: 40, bottom: 50, left: 70, right: 40 }
  })
})

function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 50))
}
)
</script>

<style scoped>
.rec-page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 60px; }

/* 标题 */
.rec-header { padding: 20px 16px 16px; border-bottom: 1px solid rgba(23,55,91,0.08); }
.rec-header h1 { margin: 8px 0 6px; font-size: 34px; }
.rec-header .page-lead { margin: 0; color: var(--muted); font-size: 14px; }

/* 布局 */
.rec-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; padding: 0 16px; align-items: start; }

/* 策略库 */
.strategy-library { position: sticky; top: 80px; padding: 20px; display: flex; flex-direction: column; gap: 14px; max-height: calc(100vh - 160px); overflow-y: auto; }
.lib-head { display: flex; justify-content: space-between; align-items: center; }
.lib-count { font-size: 12px; color: var(--muted); }

/* 分类 */
.cat-filter { display: flex; flex-wrap: wrap; gap: 5px; }
.cat-btn { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(23,55,91,0.12); background: transparent; color: var(--muted); cursor: pointer; font-size: 11px; transition: all 0.2s; }
.cat-btn:hover { border-color: var(--blue); color: var(--blue); }
.cat-btn.active { background: var(--blue); border-color: var(--blue); color: #fff; }
.cat-num { font-size: 10px; }

/* 搜索 */
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--muted); }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border-radius: 10px; border: 1px solid rgba(23,55,91,0.15); background: rgba(255,255,255,0.8); color: var(--text); font-size: 13px; outline: none; box-sizing: border-box; }
.search-input:focus { border-color: var(--blue); }
.search-input::placeholder { color: var(--muted); }

/* 策略列表 */
.lib-list { flex: 1; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 5px; max-height: none; }
.lib-list::-webkit-scrollbar { width: 3px; }
.lib-list::-webkit-scrollbar-thumb { background: rgba(23,55,91,0.15); border-radius: 2px; }

.lib-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; border: 1.5px solid transparent; background: rgba(255,255,255,0.6); cursor: pointer; text-align: left; transition: all 0.2s; gap: 8px; }
.lib-item:hover { border-color: rgba(23,55,91,0.25); background: rgba(255,255,255,0.9); }
.lib-item.selected { border-color: var(--blue); background: rgba(23,55,91,0.05); }
.lib-item-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.lib-check { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(23,55,91,0.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.lib-item.selected .lib-check { background: var(--blue); border-color: var(--blue); color: #fff; }
.lib-check svg { width: 11px; height: 11px; }
.lib-item-info { min-width: 0; }
.lib-item-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lib-item-cat { font-size: 11px; color: var(--muted); }
.lib-item-metric { text-align: right; flex-shrink: 0; }
.lib-ret { font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.lib-ret-label { font-size: 10px; color: var(--muted); }

/* 配置区 */
.config-area { display: flex; flex-direction: column; gap: 18px; }
.result-area, .config-area { grid-column: 2; }

/* 卡片 */
.card { background: rgba(255,255,255,0.84); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 4px 20px rgba(41,61,84,0.08); border-radius: 20px; }
.section-eyebrow { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.section-heading { margin: 0 0 18px; font-size: 20px; font-weight: 700; color: var(--text); }

/* 空状态 */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 40px; text-align: center; }
.empty-icon { font-size: 56px; }
.empty-title { font-size: 22px; font-weight: 700; color: var(--text); }
.empty-sub { color: var(--muted); font-size: 14px; }

/* 已选栏 */
.selected-bar { padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
.selected-bar-head { display: flex; justify-content: space-between; align-items: center; }
.clear-all-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 13px; }
.clear-all-btn:hover { color: #b82020; }
.selected-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.selected-chip { display: flex; align-items: center; gap: 6px; padding: 6px 10px 6px 8px; border-radius: 999px; border: 1.5px solid; background: rgba(255,255,255,0.8); }
.chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.chip-name { font-size: 13px; font-weight: 600; color: var(--text); }
.chip-remove { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 0 2px; }
.chip-remove:hover { color: var(--text); }

/* 权重分配 */
.allocations-section { padding: 22px 26px; }
.slider-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
.slider-row { display: flex; align-items: center; gap: 16px; }
.slider-label { display: flex; align-items: center; gap: 10px; width: 180px; flex-shrink: 0; }
.slider-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.slider-info { min-width: 0; }
.slider-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slider-cat { font-size: 11px; color: var(--muted); }
.slider-control { flex: 1; display: flex; align-items: center; gap: 14px; }
.weight-slider { flex: 1; -webkit-appearance: none; height: 6px; border-radius: 3px; background: rgba(23,55,91,0.1); outline: none; cursor: pointer; }
.weight-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--blue); cursor: pointer; box-shadow: 0 2px 6px rgba(23,55,91,0.3); }
.weight-value { font-size: 16px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; width: 48px; text-align: right; flex-shrink: 0; }

.total-weight-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 10px; font-size: 14px; }
.total-weight-row.valid { background: rgba(208,104,10,0.08); color: var(--text); }
.total-weight-row.invalid { background: rgba(184,32,32,0.08); color: #b82020; }
.total-weight-row strong { font-weight: 700; }
.weight-hint { margin-left: auto; font-size: 12px; }
.weight-hint-ok { margin-left: auto; font-size: 12px; color: #c24a00; }

/* 结果区 */
.result-section { padding: 24px 26px; }

/* KPI 大数字 */
.portfolio-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.pkpi-card { padding: 18px 14px; border-radius: 14px; background: rgba(23,55,91,0.04); text-align: center; }
.pkpi-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
.pkpi-val { font-size: 26px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; line-height: 1; }
.pkpi-compare { font-size: 11px; color: var(--muted); margin-top: 5px; }

/* 分散化效果 */
.diversification-box { padding: 14px 18px; border-radius: 12px; background: rgba(106,191,64,0.08); border: 1px solid rgba(106,191,64,0.2); margin-bottom: 18px; }
.div-title { font-size: 13px; font-weight: 700; color: #4a8a2a; margin-bottom: 6px; }
.div-desc { font-size: 13px; color: var(--text); line-height: 1.7; }
.div-desc strong { color: #4a8a2a; }

/* 成分表 */
.components-table { border: 1px solid rgba(23,55,91,0.1); border-radius: 12px; overflow: hidden; margin-bottom: 18px; }
.ct-head, .ct-row { display: grid; }
.ct-head { background: rgba(23,55,91,0.05); }
.ct-row:nth-child(even) { background: rgba(23,55,91,0.025); }
.ct-cell { padding: 11px 14px; font-size: 13px; display: flex; align-items: center; gap: 7px; }
.col-metric { color: var(--muted); }
.col-strat { flex-direction: column; align-items: flex-start; gap: 2px; }
.strat-dot { width: 8px; height: 8px; border-radius: 50%; }
.strat-name { font-size: 12px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; }
.ct-val { font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }

/* AI 解读 */
.ai-card { background: rgba(255,252,246,0.9); padding: 20px 22px; }
.ai-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ai-icon { font-size: 18px; }
.ai-title { font-size: 14px; font-weight: 700; color: var(--text); flex: 1; }
.ai-refresh-btn { background: none; border: 1px solid rgba(23,55,91,0.2); color: var(--muted); padding: 5px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
.ai-refresh-btn:hover:not(:disabled) { border-color: var(--blue); color: var(--blue); }
.ai-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-body { font-size: 14px; color: var(--text); line-height: 1.9; background: rgba(255,255,255,0.6); padding: 14px 16px; border-radius: 10px; white-space: pre-wrap; }
.ai-placeholder { font-size: 13px; color: var(--muted); padding: 14px 16px; border-radius: 10px; border: 1.5px dashed rgba(23,55,91,0.15); text-align: center; cursor: pointer; transition: all 0.2s; }
.ai-placeholder:hover { border-color: var(--blue); color: var(--blue); }

/* 权重警告 */
.weight-warning { display: flex; align-items: center; gap: 12px; padding: 16px 20px; }
.warning-icon { font-size: 24px; }
.warning-text { font-size: 14px; color: var(--text); }

/* 颜色 */
.gain { color: #c24a00 !important; }
.loss { color: #b82020 !important; }

/* ── 模拟生成按钮 ── */
.simulate-cta {
  display: flex; justify-content: center; padding: 4px 0 12px;
}
.simulate-btn {
  padding: 12px 36px; border-radius: 14px; border: none;
  background: linear-gradient(135deg,#9e722e,#c24a00); color: #fff;
  font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(158,114,46,0.25);
}
.simulate-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(158,114,46,0.35); }
.simulate-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.simulating-text { display: flex; align-items: center; gap: 8px; }
.spin-ring-xs { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.9s linear infinite; }

@media (max-width: 1100px) {
  .rec-layout { grid-template-columns: 1fr; padding: 0 16px; }
  .strategy-library { position: static; max-height: 320px; }
  .portfolio-kpis { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .rec-header { padding: 24px 16px 16px; }
  .slider-label { width: 120px; }
  .portfolio-kpis { grid-template-columns: 1fr 1fr; }
}

/* ── AI 推荐区域 ── */
.ai-rec-section { padding: 20px; }
.ai-rec-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; }
.ai-rec-actions { flex-shrink: 0; }
.ai-rec-btn {
  padding: 10px 22px; border-radius: 12px; border: none;
  background: linear-gradient(135deg,#9e722e,#c24a00); color: #fff;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(158,114,46,0.25);
}
.ai-rec-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(158,114,46,0.35); }
.ai-rec-btn.refresh { background: rgba(23,55,91,0.08); color: var(--blue); box-shadow: none; border: 1px solid rgba(23,55,91,0.15); }
.ai-rec-btn.refresh:hover:not(:disabled) { border-color: var(--blue); background: rgba(23,55,91,0.12); }
.ai-rec-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.rec-loading { display: flex; align-items: center; gap: 12px; padding: 20px 0; font-size: 14px; color: var(--muted); }
.spin-ring { display: inline-block; width: 22px; height: 22px; border: 2px solid rgba(158,114,46,0.2); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.9s linear infinite; }
.spin-ring-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(158,114,46,0.2); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 升级提示 */
.escalation-tip { display: flex; gap: 12px; padding: 16px; border-radius: 12px; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2); margin-bottom: 16px; }
.et-icon { font-size: 20px; flex-shrink: 0; }
.et-body { flex: 1; }
.et-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.et-action { font-size: 13px; color: var(--muted); }

/* 推荐列表 */
.rec-list-title { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
.rec-list-title strong { color: var(--text); }
.rec-items { display: flex; flex-direction: column; gap: 8px; }
.rec-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  border-radius: 12px; background: rgba(23,55,91,0.04);
  border: 1.5px solid rgba(23,55,91,0.08); transition: all 0.2s;
}
.rec-item:hover { border-color: rgba(158,114,46,0.3); background: rgba(158,114,46,0.04); }
.ri-rank { width: 26px; height: 26px; border-radius: 50%; background: rgba(158,114,46,0.1); border: 1px solid rgba(158,114,46,0.2); color: var(--gold); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ri-info { flex: 1; min-width: 0; }
.ri-name { font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ri-cat { font-size: 11px; color: var(--muted); margin-top: 2px; }
.ri-match { text-align: center; flex-shrink: 0; }
.ri-matchscore { font-size: 18px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.ri-matchlab { font-size: 10px; color: var(--muted); text-transform: uppercase; }
.ri-metrics { flex-shrink: 0; }
.rim { font-size: 15px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.ri-add { padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(23,55,91,0.15); background: rgba(255,255,255,0.7); color: var(--text); cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; flex-shrink: 0; }
.ri-add:hover { border-color: var(--gold); color: var(--gold); }
.ri-add.added { border-color: #4ade80; background: rgba(74,222,128,0.1); color: #4ade80; }

/* AI 解读 */
.rec-explanation { margin-top: 16px; padding: 16px; border-radius: 12px; background: rgba(23,55,91,0.04); border: 1px solid rgba(23,55,91,0.08); }
.exp-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold); margin-bottom: 8px; }
.exp-body { font-size: 13px; color: var(--muted); line-height: 1.9; }
.exp-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); margin-top: 12px; }
.exp-regen { margin-top: 10px; padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(23,55,91,0.12); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.exp-regen:hover { border-color: var(--blue); color: var(--blue); }

.rec-idle { padding: 12px 0; }
.ri-idle-hint { font-size: 13px; color: var(--muted); text-align: center; line-height: 1.7; }


/* ── Monte Carlo ── */
.mc-section { padding: 24px 26px; }
.mc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.mc-close { background: none; border: none; font-size: 22px; color: var(--muted); cursor: pointer; padding: 0 4px; }
.mc-close:hover { color: var(--text); }

.mc-chart-wrap { width: 100%; height: 320px; margin-bottom: 20px; }
.mc-chart { width: 100%; height: 100%; }

.mc-optimal { margin-top: 8px; }
.mc-optimal-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 12px; }
.mc-optimal-list { display: flex; flex-direction: column; gap: 8px; }
.mc-optimal-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  border-radius: 12px; background: rgba(208,104,10,0.05);
  border: 1.5px solid rgba(208,104,10,0.15); cursor: pointer; transition: all 0.2s;
}
.mc-optimal-item:hover { border-color: rgba(208,104,10,0.4); background: rgba(208,104,10,0.1); }
.mo-rank { font-size: 12px; font-weight: 700; color: var(--gold); width: 28px; flex-shrink: 0; }
.mo-weights { flex: 1; display: flex; flex-wrap: wrap; gap: 5px; }
.mo-w-chip { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid; background: rgba(255,255,255,0.7); color: var(--text); }
.mo-metrics { display: flex; gap: 12px; flex-shrink: 0; }
.mom { font-size: 12px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.mom.ret { min-width: 60px; text-align: right; }
.mom.vol { color: var(--muted); min-width: 50px; text-align: right; }
.mom.sharpe { color: var(--gold); }
.mo-apply {
  padding: 4px 12px; border-radius: 8px; border: 1px solid rgba(208,104,10,0.3);
  background: rgba(208,104,10,0.08); color: #9e722e; font-size: 12px; font-weight: 600;
  cursor: pointer; flex-shrink: 0; transition: all 0.2s;
}
.mo-apply:hover { background: rgba(208,104,10,0.18); }

/* MC button */
.mc-btn {
  padding: 12px 24px; border-radius: 14px; border: none;
  background: rgba(23,55,91,0.08); color: var(--blue);
  border: 1.5px solid rgba(23,55,91,0.2);
  font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.mc-btn:hover:not(:disabled) { background: rgba(23,55,91,0.14); }
.mc-btn:disabled { opacity: 0.6; cursor: not-allowed; }

</style>
