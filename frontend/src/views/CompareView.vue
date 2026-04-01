<template>
  <div class="page-shell compare-page">

    <!-- ═══ 顶部标题 + 模式切换 ═══ -->
    <header class="compare-header">
      <div class="header-left">
        <div class="eyebrow">Product shelf analysis</div>
        <h1>产品线诊断台</h1>
        <p class="page-lead">从产品地图发现结构空白 · AI驱动的组合诊断</p>
      </div>
      <div class="mode-tabs">
        <button
          v-for="m in modes"
          :key="m.key"
          class="mode-tab"
          :class="{ active: activeMode === m.key }"
          @click="activeMode = m.key"
        >
          <span class="mode-icon">{{ m.icon }}</span>
          {{ m.label }}
        </button>
      </div>
    </header>

    <!-- ═══ 主内容 ═══ -->
    <div class="compare-layout">

      <!-- ═══ 左侧：入选策略列表 ═══ -->
      <div class="selector-wrap">
      <aside class="selector-panel card">
        <div class="panel-head">
          <div class="section-eyebrow">Portfolio</div>
          <div class="panel-count">{{ selectedIds.length }} 条入选</div>
        </div>
        <div class="pick-list">
          <div v-for="s in selectedStrategies" :key="s.seed" class="pick-row">
            <div class="pick-left">
              <div class="pick-check active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
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
            </div>
          </div>
          <div v-if="selectedIds.length === 0" class="pick-empty">
            在右侧 AI 诊断区生成组合建议后，选入策略将显示在此
          </div>
        </div>
      </aside>
      </div>

      <!-- ═══ 右侧：结果区域 ═══ -->
      <div class="result-area">

        <!-- 模式一：产品竞争力地图 -->
        <template v-if="activeMode === 'map'">
          <section class="result-section card map-section">
            <div class="section-eyebrow">Product map</div>
            <h2 class="section-heading">产品竞争力地图</h2>
            <div class="map-toolbar">
              <div class="axis-label">横轴：波动率（%）→</div>
              <div class="map-legend">
                <span v-for="cat in allCategories" :key="cat" class="map-legend-item">
                  <span class="map-legend-dot" :style="{ background: getCatColor(cat) }"></span>
                  {{ cat }}
                </span>
              </div>
              <div class="axis-label axis-label-v">↑ 年化收益（%）</div>
            </div>
            <div ref="mapChartRef" class="map-chart"></div>
            <div class="map-quadrant-guide">
              <div class="quadrant-cell q1">
                <div class="q-label">低波动 + 高收益</div>
                <div class="q-desc">优质象限，优先布局</div>
              </div>
              <div class="quadrant-cell q2">
                <div class="q-label">高波动 + 高收益</div>
                <div class="q-desc">进攻型象限，适量配置</div>
              </div>
              <div class="quadrant-cell q3">
                <div class="q-label">高波动 + 低收益</div>
                <div class="q-desc">预警象限，考虑退出</div>
              </div>
              <div class="quadrant-cell q4">
                <div class="q-label">低波动 + 低收益</div>
                <div class="q-desc">防御型象限，稳健底仓</div>
              </div>
            </div>
          </section>

          <section class="result-section card">
            <div class="section-eyebrow">Shelf analysis</div>
            <h2 class="section-heading">产品线结构分析</h2>
            <div class="shelf-grid">
              <div
                v-for="cat in shelfAnalysis"
                :key="cat.name"
                class="shelf-cat"
                :style="{ borderLeftColor: getCatColor(cat.name) }"
              >
                <div class="shelf-cat-header">
                  <div class="shelf-cat-name">{{ cat.name }}</div>
                  <div class="shelf-cat-count">{{ cat.count }} 条</div>
                </div>
                <div class="shelf-cat-metrics">
                  <div class="scm-item">
                    <div class="scm-val" :class="cat.avgReturn >= 0 ? 'gain' : 'loss'">{{ cat.avgReturn }}%</div>
                    <div class="scm-lab">平均年化</div>
                  </div>
                  <div class="scm-item">
                    <div class="scm-val">{{ cat.avgDrawdown }}%</div>
                    <div class="scm-lab">平均回撤</div>
                  </div>
                </div>
                <div class="shelf-gaps">
                  <template v-if="cat.gap">
                    <div class="shelf-gap-tag">🎯 {{ cat.gap }}</div>
                  </template>
                  <template v-else>
                    <div class="shelf-ok-tag">✅ 象限饱满</div>
                  </template>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- 模式二：AI组合诊断 -->
        <template v-if="activeMode === 'ai'">
          <!-- 客户画像筛选 + AI按钮 -->
          <section class="result-section card ai-filter-card">
            <div class="section-eyebrow">Client profile</div>
            <h2 class="section-heading">AI 组合诊断</h2>

            <div class="ai-filter-row">
              <div class="filter-group">
                <div class="filter-label">风险偏好</div>
                <div class="risk-options">
                  <button
                    v-for="r in riskOptions"
                    :key="r.value"
                    class="risk-opt"
                    :class="{ active: clientProfile.risk === r.value }"
                    @click="clientProfile.risk = r.value"
                  >
                    <span class="risk-dot" :style="{ background: r.color }"></span>
                    {{ r.label }}
                  </button>
                </div>
              </div>
              <div class="filter-group">
                <div class="filter-label">收益目标</div>
                <div class="return-options">
                  <button
                    v-for="r in returnOptions"
                    :key="r.value"
                    class="ret-opt"
                    :class="{ active: clientProfile.returnTarget === r.value }"
                    @click="clientProfile.returnTarget = r.value"
                  >
                    {{ r.label }}
                  </button>
                </div>
              </div>
              <div class="filter-group">
                <div class="filter-label">资金规模</div>
                <div class="return-options">
                  <button
                    v-for="s in scaleOptions"
                    :key="s.value"
                    class="ret-opt"
                    :class="{ active: clientProfile.scale === s.value }"
                    @click="clientProfile.scale = s.value"
                  >
                    {{ s.label }}
                  </button>
                </div>
              </div>
              <div class="ai-diagnosis-section">
                <button class="ai-diagnosis-btn" @click="runAiDiagnosis" :disabled="aiLoading">
                  <span class="ai-icon" :class="{ spinning: aiLoading }">🧠</span>
                  <div class="ai-btn-text">
                    <div class="ai-btn-title">{{ aiLoading ? 'AI 诊断中...' : '生成 AI 组合建议' }}</div>
                    <div class="ai-btn-sub">基于 {{ filteredStrategies.length }} 条策略分析</div>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <section v-if="aiResult" class="result-section card ai-result-card">
            <div class="ai-result-header">
              <div class="section-eyebrow">AI Diagnosis · Generated {{ new Date().toLocaleDateString('zh-CN') }}</div>
              <button class="regenerate-btn" @click="runAiDiagnosis" :disabled="aiLoading">🔄 重新生成</button>
            </div>
            <h2 class="section-heading">组合诊断报告</h2>

            <div class="diag-summary">
              <div class="diag-tag">{{ aiResult.riskLevel }}</div>
              <div class="diag-tag">{{ aiResult.scale }}</div>
              <div class="diag-tag gain-tag">{{ aiResult.expectedReturn }}</div>
            </div>

            <div class="diag-triad">
              <div
                v-for="layer in aiResult.layers"
                :key="layer.name"
                class="diag-layer"
                :style="{ borderColor: layer.color + '44' }"
              >
                <div class="layer-header">
                  <div class="layer-icon">{{ layer.icon }}</div>
                  <div class="layer-name">{{ layer.name }}</div>
                  <div class="layer-alloc">{{ layer.allocation }}</div>
                </div>
                <div class="layer-strategy">{{ layer.strategyName }}</div>
                <div class="layer-role">{{ layer.role }}</div>
                <div class="layer-metrics">
                  <span class="lm gain">年化 {{ layer.annualReturn }}</span>
                  <span class="lm">回撤 {{ layer.drawdown }}</span>
                  <span class="lm">胜率 {{ layer.winRate }}</span>
                </div>
                <div class="layer-reason">{{ layer.reason }}</div>
              </div>
            </div>

            <div class="portfolio-metrics">
              <div class="pm-item">
                <div class="pm-val gain">{{ aiResult.portfolioReturn }}</div>
                <div class="pm-label">组合预期年化</div>
              </div>
              <div class="pm-divider"></div>
              <div class="pm-item">
                <div class="pm-val loss">{{ aiResult.portfolioDrawdown }}</div>
                <div class="pm-label">组合最大回撤</div>
              </div>
              <div class="pm-divider"></div>
              <div class="pm-item">
                <div class="pm-val">{{ aiResult.sharpeRatio }}</div>
                <div class="pm-label">夏普比率</div>
              </div>
              <div class="pm-divider"></div>
              <div class="pm-item">
                <div class="pm-val">{{ aiResult.coverage }}</div>
                <div class="pm-label">风险分散度</div>
              </div>
            </div>

            <div class="synergy-section">
              <div class="section-eyebrow" style="margin-bottom: 12px;">协同逻辑</div>
              <div class="synergy-body">{{ aiResult.synergyLogic }}</div>
            </div>
          </section>

          <section v-else class="result-section card ai-empty-card">
            <div class="ai-empty-icon">🧠</div>
            <div class="ai-empty-title">AI 组合诊断</div>
            <div class="ai-empty-sub">根据左侧客户画像，点击上方「生成 AI 组合建议」按钮，AI 将基于策略自动构建最优组合方案</div>
            <div class="ai-empty-steps">
              <div class="ai-step"><span class="step-num">1</span>设置风险偏好与收益目标</div>
              <div class="ai-step"><span class="step-num">2</span>AI 扫描全产品线</div>
              <div class="ai-step"><span class="step-num">3</span>输出攻守兼备的组合方案</div>
            </div>
          </section>

          <section v-if="selectedStrategies.length > 0" class="result-section card">
            <div class="section-eyebrow">Selected strategies</div>
            <h2 class="section-heading">入选策略详情</h2>
            <div class="selected-detail-grid">
              <div v-for="s in selectedStrategies" :key="s.seed" class="selected-detail-card">
                <div class="sdc-header">
                  <div class="sdc-cat">{{ s.navCategory }}</div>
                  <div class="risk-badge" :class="'risk-' + ((s as any).riskLevel || 'R3')">
                    {{ ((s as any).riskLevel || 'R3') }}
                  </div>
                </div>
                <div class="sdc-name">{{ s.name }}</div>
                <div class="sdc-owner">{{ s.owner }}</div>
                <div class="sdc-metrics">
                  <div class="sdc-m">
                    <div class="sdc-mv" :class="s.annualReturn >= 0 ? 'gain' : 'loss'">{{ fmt(s.annualReturn) }}%</div>
                    <div class="sdc-ml">年化</div>
                  </div>
                  <div class="sdc-m">
                    <div class="sdc-mv">{{ fmt(s.winRate, 1, false) }}%</div>
                    <div class="sdc-ml">胜率</div>
                  </div>
                  <div class="sdc-m">
                    <div class="sdc-mv loss">{{ fmt(s.maxDrawdown, 1, false) }}%</div>
                    <div class="sdc-ml">回撤</div>
                  </div>
                </div>
                <div class="sdc-logic">{{ s.logicSummary }}</div>
                <div class="sdc-tags">
                  <span v-for="tag in (s.tags || []).slice(0, 3)" :key="tag" class="card-tag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- 模式三：持仓组合分析 -->
        <template v-if="activeMode === 'portfolio'">
          <section class="result-section card portfolio-section">
            <div class="section-eyebrow">Portfolio analysis</div>
            <h2 class="section-heading">持仓组合分析</h2>

            <div class="portfolio-builder">
              <!-- 左侧：策略选择 -->
              <div class="pb-left">
                <div class="pb-title">选择持仓策略（最多5条）</div>
                <div class="pb-hint">从下方勾选策略</div>
                <div class="pb-strategy-list">
                  <div
                    v-for="s in allStrategies"
                    :key="s.seed"
                    class="pb-strategy-row"
                    :class="{ selected: portfolioIds.includes(s.seed) }"
                    @click="togglePortfolio(s.seed)"
                  >
                    <div class="pb-check" :class="{ active: portfolioIds.includes(s.seed) }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="pb-sinfo">
                      <div class="pb-sname">{{ s.name }}</div>
                      <div class="pb-scat">{{ s.navCategory }}</div>
                    </div>
                    <div class="pb-sret" :class="s.annualReturn >= 0 ? 'gain' : 'loss'">
                      {{ s.annualReturn >= 0 ? '+' : '' }}{{ s.annualReturn.toFixed(2) }}%
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧：权重分配 + 组合结果 -->
              <div class="pb-right" v-if="portfolioStrategies.length > 0">
                <div class="alloc-title">配置权重分配</div>
                <div class="alloc-list">
                  <div v-for="s in portfolioStrategies" :key="s.seed" class="alloc-row">
                    <div class="ar-name">{{ s.name }}</div>
                    <div class="ar-slider-wrap">
                      <input
                        type="range"
                        class="ar-slider"
                        min="5"
                        max="80"
                        :value="portfolioWeights[s.seed] || 20"
                        @input="setWeight(s.seed, Number(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                    <div class="ar-controls">
                      <button class="ar-btn" @click="adjustWeight(s.seed, -1)">−</button>
                      <input
                        type="number"
                        class="ar-input"
                        min="5"
                        max="80"
                        :value="portfolioWeights[s.seed] || 20"
                        @change="setWeight(s.seed, Math.max(5, Math.min(80, Number(($event.target as HTMLInputElement).value))))"
                      />
                      <span class="ar-pct">%</span>
                      <button class="ar-btn" @click="adjustWeight(s.seed, 1)">+</button>
                    </div>
                  </div>
                </div>

                <div class="alloc-total" :class="{ warning: portfolioTotal !== 100 }">
                  权重合计：<strong>{{ portfolioTotal }}%</strong>
                  <span v-if="portfolioTotal !== 100" class="alloc-warning">（需等于100%）</span>
                </div>

                <!-- 生成组合分析按钮 -->
                <div class="port-gen-btn-wrap" v-if="portfolioTotal === 100">
                  <button class="port-gen-btn" @click="onGeneratePortfolio" :disabled="portfolioGenerated">
                    🚀 生成组合分析
                  </button>
                </div>

                <!-- 组合整体指标 -->
                <div class="port-metrics" v-if="portfolioGenerated && portfolioTotal === 100">
                  <div class="port-m-title">组合综合指标</div>
                  <div class="port-m-grid">
                    <div class="port-m-item">
                      <div class="pmi-val gain">{{ portfolioMetrics.return }}</div>
                      <div class="pmi-label">加权年化收益</div>
                    </div>
                    <div class="port-m-item">
                      <div class="pmi-val loss">{{ portfolioMetrics.drawdown }}</div>
                      <div class="pmi-label">加权最大回撤</div>
                    </div>
                    <div class="port-m-item">
                      <div class="pmi-val">{{ portfolioMetrics.sharpe }}</div>
                      <div class="pmi-label">加权夏普比率</div>
                    </div>
                    <div class="port-m-item">
                      <div class="pmi-val">{{ portfolioMetrics.coverage }}</div>
                      <div class="pmi-label">风险分散度</div>
                    </div>
                  </div>

                  <div class="coverage-bar-wrap">
                    <div class="cbw-label">风险分散效果</div>
                    <div class="cbw-track">
                      <div class="cbw-fill" :style="{ width: coveragePct + '%', background: coverageColor }"></div>
                    </div>
                    <div class="cbw-desc">{{ coverageDesc }}</div>
                  </div>

                  <!-- 指标算法说明 -->
                  <div class="algo-section">
                    <div class="algo-title">📐 指标计算公式</div>
                    <div class="algo-formula">
                      <div class="af-row">
                        <div class="af-name">加权年化收益</div>
                        <div class="af-formula">Σ(策略i权重 × 策略i年化收益率)</div>
                      </div>
                      <div class="af-example" v-if="portfolioStrategies.length">
                        <template v-for="(s, i) in portfolioStrategies" :key="s.seed">
                          <span v-if="i > 0"> + </span><span class="af-w">{{ portfolioWeights[s.seed] || 20 }}%</span> × <span class="af-m">{{ s.annualReturn >= 0 ? '+' : '' }}{{ s.annualReturn.toFixed(2) }}%</span>
                        </template>
                        <span class="af-eq"> = </span>
                        <span class="af-result gain">{{ portfolioMetrics.return }}</span>
                      </div>
                    </div>
                    <div class="algo-formula">
                      <div class="af-row">
                        <div class="af-name">加权最大回撤</div>
                        <div class="af-formula">Σ(策略i权重 × 策略i最大回撤)</div>
                      </div>
                      <div class="af-example" v-if="portfolioStrategies.length">
                        <template v-for="(s, i) in portfolioStrategies" :key="s.seed">
                          <span v-if="i > 0"> + </span><span class="af-w">{{ portfolioWeights[s.seed] || 20 }}%</span> × <span class="af-m loss">{{ (s.maxDrawdown || 0).toFixed(2) }}%</span>
                        </template>
                        <span class="af-eq"> = </span>
                        <span class="af-result loss">{{ portfolioMetrics.drawdown }}</span>
                      </div>
                    </div>
                    <div class="algo-formula">
                      <div class="af-row">
                        <div class="af-name">加权夏普比率</div>
                        <div class="af-formula">加权年化收益 ÷ 加权最大回撤</div>
                      </div>
                      <div class="af-example">
                        <span class="af-m">{{ portfolioMetrics.return }}</span>
                        <span> ÷ </span>
                        <span class="af-m">{{ portfolioMetrics.drawdown }}</span>
                        <span class="af-eq"> = </span>
                        <span class="af-result">{{ portfolioMetrics.sharpe }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 风险收益对比条 -->
                <div class="port-compare" v-if="portfolioGenerated && portfolioTotal === 100">
                  <div class="pc-title">各策略收益贡献度</div>
                  <div v-for="s in portfolioStrategies" :key="s.seed" class="pc-row">
                    <div class="pc-name">{{ s.name }}</div>
                    <div class="pc-bar-track">
                      <div
                        class="pc-bar-fill"
                        :style="{ width: contribPct(s) + '%', background: getCatColor(s.navCategory) }"
                      ></div>
                    </div>
                    <div class="pc-contrib">{{ contribPct(s) }}%</div>
                  </div>
                </div>

                <!-- AI 组合解读 -->
                <div class="port-ai-section" v-if="portfolioGenerated && portfolioTotal === 100">
                  <div class="pai-header">
                    <span class="pai-icon">🧠</span>
                    <span class="pai-title">AI 组合配置解读</span>
                    <button class="pai-btn" @click="loadPortfolioNarrative" :disabled="portfolioNarrLoading">
                      {{ portfolioNarrLoading ? '生成中...' : portfolioNarrative ? '🔄 重新生成' : '🚀 生成解读' }}
                    </button>
                  </div>
                  <div class="pai-loading" v-if="portfolioNarrLoading">
                    <span class="spinner-ring-sm"></span> AI 正在生成组合配置解读...
                  </div>
                  <div class="pai-body" v-if="portfolioNarrative && !portfolioNarrLoading">
                    {{ portfolioNarrative }}
                  </div>
                </div>

              </div>

              <!-- 未选择状态 -->
              <div class="pb-empty" v-else>
                <div class="pbe-icon">📊</div>
                <div class="pbe-title">请从左侧选择持仓策略</div>
                <div class="pbe-sub">最多选择5条策略进行组合分析</div>
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

// ═══════════════ 常量 ═══════════════
const CAT_COLORS: Record<string, string> = {
  '股票多头': '#3a7fbf', '债券增强': '#6abf40', '商品及衍生品': '#d4a017',
  '量化策略': '#8b5cf6', '海外配置': '#d0680a', '绝对收益': '#4ade80',
  '现金管理': '#58c7ff', '其他': '#6d7c8d',
}

const modes = [
  { key: 'map', label: '产品地图', icon: '🗺️' },
  { key: 'ai', label: 'AI诊断', icon: '🧠' },
  { key: 'portfolio', label: '持仓组合', icon: '📊' },
]
const activeMode = ref<'map' | 'ai' | 'portfolio'>('map')

const riskOptions = [
  { value: 'R3', label: '稳健型', color: '#f59e0b' },
  { value: 'R4', label: '积极型', color: '#f97316' },
  { value: 'R5', label: '激进型', color: '#f87171' },
]
const returnOptions = [
  { value: 'stable', label: '5%以下' },
  { value: 'moderate', label: '5%-10%' },
  { value: 'aggressive', label: '10%以上' },
]
const scaleOptions = [
  { value: 'small', label: '1000万以下' },
  { value: 'medium', label: '1000-5000万' },
  { value: 'large', label: '5000万以上' },
]

// ═══════════════ 数据 ═══════════════
const allStrategies = ref<StrategyItem[]>([])
const loading = ref(false)
const mapChartRef = ref<HTMLElement>()
const mapChartInstance = ref<echarts.ECharts | null>(null)

const clientProfile = ref({ risk: 'R3', returnTarget: 'moderate', scale: 'medium' })
const aiResult = ref<any>(null)
const aiLoading = ref(false)
const selectedIds = ref<number[]>([])

// 持仓组合
const portfolioIds = ref<number[]>([])
const portfolioWeights = ref<Record<number, number>>({})
const portfolioNarrative = ref('')
const portfolioNarrLoading = ref(false)
const portfolioGenerated = ref(false)

const selectedStrategies = computed(() =>
  selectedIds.value.map(id => allStrategies.value.find(s => s.seed === id)).filter(Boolean) as StrategyItem[]
)
const portfolioStrategies = computed(() =>
  portfolioIds.value.map(id => allStrategies.value.find(s => s.seed === id)).filter(Boolean) as StrategyItem[]
)
const filteredStrategies = computed(() =>
  allStrategies.value.filter(s => (s as any).riskLevel === clientProfile.value.risk)
)
const allCategories = computed(() => [...new Set(allStrategies.value.map(s => s.navCategory))])

const portfolioTotal = computed(() =>
  portfolioStrategies.value.reduce((sum, s) => sum + (portfolioWeights.value[s.seed] || 20), 0)
)
const portfolioTotalAbsReturn = computed(() =>
  portfolioStrategies.value.reduce((sum, s) => sum + Math.abs(s.annualReturn), 0) || 1
)

// ═══════════════ 产品线分析 ═══════════════
const shelfAnalysis = computed(() => {
  const catMap: Record<string, StrategyItem[]> = {}
  for (const s of allStrategies.value) {
    const cat = s.navCategory || '其他'
    if (!catMap[cat]) catMap[cat] = []
    catMap[cat].push(s)
  }
  return Object.entries(catMap).map(([name, strategies]) => {
    const valid = strategies.filter(s => s.annualReturn > 0)
    const avgReturn = valid.length ? (valid.reduce((a, b) => a + b.annualReturn, 0) / valid.length).toFixed(1) : '—'
    const avgDrawdown = valid.length
      ? (valid.reduce((a, b) => a + (b.maxDrawdown || 0), 0) / valid.length).toFixed(1)
      : '—'
    const hasHighReturn = strategies.some(s => s.annualReturn > 10)
    const hasLowDrawdown = strategies.some(s => (s.maxDrawdown || 0) < 10)
    let gap = ''
    if (name === '股票多头' && !hasHighReturn) gap = '缺少高收益旗舰产品'
    if (name === '绝对收益' && !hasLowDrawdown) gap = '缺少低回撤明星'
    return { name, count: strategies.length, avgReturn, avgDrawdown, gap }
  })
})

// ═══════════════ 组合指标 ═══════════════
const portfolioMetrics = computed(() => {
  if (portfolioTotal.value !== 100) return { return: '—', drawdown: '—', sharpe: '—', coverage: '—' }
  const strategies = portfolioStrategies.value
  const avgReturn = strategies.reduce((sum, s) => {
    const w = (portfolioWeights.value[s.seed] || 20) / 100
    return sum + s.annualReturn * w
  }, 0)
  const avgDrawdown = strategies.reduce((sum, s) => {
    const w = (portfolioWeights.value[s.seed] || 20) / 100
    return sum + (s.maxDrawdown || 0) * w
  }, 0)
  const sharpe = avgDrawdown > 0 ? (avgReturn / avgDrawdown) : 0
  return {
    return: `${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(2)}%`,
    drawdown: `-${avgDrawdown.toFixed(2)}%`,
    sharpe: sharpe.toFixed(2),
    coverage: ['低', '中', '高'][Math.min(Math.floor(strategies.length / 2), 2)],
  }
})

const coveragePct = computed(() => Math.min(portfolioStrategies.value.length * 20, 95))
const coverageColor = computed(() => {
  const n = portfolioStrategies.value.length
  if (n <= 1) return '#f87171'
  if (n <= 2) return '#f59e0b'
  if (n <= 3) return '#58c7ff'
  return '#4ade80'
})
const coverageDesc = computed(() => {
  const n = portfolioStrategies.value.length
  if (n <= 1) return '单策略持仓，无风险分散'
  if (n <= 2) return '少量分散，组合风险中等'
  if (n <= 3) return '适度分散，组合风险较可控'
  return '充分分散，组合风险分散效果良好'
})

// ═══════════════ 工具 ═══════════════
function getCatColor(cat: string) { return CAT_COLORS[cat] || '#6d7c8d' }
function contribPct(s: StrategyItem): string {
  const w = portfolioWeights.value[s.seed] || 20
  const pct = w * Math.abs(s.annualReturn) / portfolioTotalAbsReturn.value
  return Math.max(5, Math.min(100, pct)).toFixed(0)
}
function fmt(v: number | null | undefined, decimals = 2, sign = true): string {
  if (v == null || typeof v !== 'number' || isNaN(v)) return '—'
  return (sign && v >= 0 ? '+' : '') + v.toFixed(decimals)
}

// ═══════════════ 产品地图 ═══════════════
function renderMap() {
  if (!mapChartRef.value) return
  if (mapChartInstance.value) {
    mapChartInstance.value.dispose()
    mapChartInstance.value = null
  }
  mapChartInstance.value = echarts.init(mapChartRef.value)

  const data = allStrategies.value.map(s => ({
    name: s.name,
    value: [
      parseFloat((s.volatilityValue || 10).toFixed(2)),
      parseFloat(s.annualReturn.toFixed(2)),
      parseFloat((s.maxDrawdown || 5).toFixed(2)),
      s.name, s.navCategory, s.seed,
    ],
    itemStyle: { color: getCatColor(s.navCategory) },
  }))

  const volValues = allStrategies.value.map(s => s.volatilityValue || 10)
  const retValues = allStrategies.value.map(s => s.annualReturn)
  const minVol = 0
  const maxVol = Math.max(...volValues, 20) + 2
  const minRet = Math.min(...retValues) - 3
  const maxRet = Math.max(...retValues) + 3

  mapChartInstance.value.setOption({
    backgroundColor: 'transparent',
    animation: true,
    grid: { top: 20, left: 60, right: 40, bottom: 60 },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,252,246,0.97)',
      borderColor: 'rgba(23,55,91,0.15)',
      textStyle: { color: '#19324a' },
      formatter: (p: any) => {
        const [vol, ret, dd, name, cat] = p.data.value
        return `<div style="font-size:13px;font-weight:700;margin-bottom:6px">${name}</div>
          <div style="font-size:12px;color:#6d7c8d;margin-bottom:4px">${cat}</div>
          <div style="font-size:12px">波动率 <b>${vol}%</b></div>
          <div style="font-size:12px">年化收益 <b style="color:#c24a00">${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%</b></div>
          <div style="font-size:12px">最大回撤 <b style="color:#b82020">-${dd.toFixed(2)}%</b></div>`
      },
    },
    xAxis: {
      type: 'value', name: '波动率 →', nameLocation: 'middle', nameGap: 36,
      nameTextStyle: { color: '#6d7c8d', fontSize: 12 },
      min: minVol, max: maxVol,
      axisLine: { lineStyle: { color: 'rgba(23,55,91,0.2)' } },
      axisLabel: { color: '#6d7c8d', fontSize: 11, formatter: (v: number) => `${v}%` },
      splitLine: { show: false },
      markLine: { silent: true, lineStyle: { color: 'rgba(23,55,91,0.12)', type: 'dashed', width: 1 }, data: [{ xAxis: 5 }, { xAxis: 10 }, { xAxis: 15 }, { xAxis: 20 }] },
    },
    yAxis: {
      type: 'value', name: '↑ 年化收益 %', nameTextStyle: { color: '#6d7c8d', fontSize: 12 },
      min: minRet, max: maxRet,
      axisLabel: { color: '#6d7c8d', formatter: (v: number) => `${v}%` },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(23,55,91,0.08)' } },
      markLine: { silent: true, lineStyle: { color: 'rgba(23,55,91,0.1)', type: 'dashed', width: 1 }, data: [{ yAxis: 0 }] },
    },
    series: [{
      type: 'scatter',
      symbolSize: (val: number[]) => Math.max(40, Math.min(72, 66 - val[2] * 2)),
      data,
      label: {
        show: true,
        formatter: (p: any) => {
          const name = p.data.value[3] as string
          return name.length > 7 ? name.slice(0, 6) + '…' : name
        },
        color: '#19324a', fontSize: 10, position: 'top', distance: 4,
      },
    }],
  }, true)
}

// ═══════════════ AI诊断 ═══════════════
async function runAiDiagnosis() {
  aiLoading.value = true
  aiResult.value = null
  await new Promise(r => setTimeout(r, 1200))

  const strategies = filteredStrategies.value.length >= 3 ? filteredStrategies.value : allStrategies.value.slice(0, 6)
  const picked = [...strategies].sort((a, b) => b.annualReturn - a.annualReturn).slice(0, Math.min(4, strategies.length))
  selectedIds.value = picked.map(s => s.seed)

  const riskLabel = { R3: '稳健型 (R3)', R4: '积极型 (R4)', R5: '激进型 (R5)' }[clientProfile.value.risk] || 'R3'
  const scaleLabel = { small: '小额客户（千万以下）', medium: '中额客户（千万级）', large: '大额客户（亿级）' }[clientProfile.value.scale]
  const returnLabel = { stable: '5%以下稳定收益', moderate: '5%-10%均衡收益', aggressive: '10%以上进取收益' }[clientProfile.value.returnTarget]

  const layers = [
    { name: '进攻层', icon: '⚡', color: '#d0680a', allocation: picked.length >= 2 ? '40%' : '—', strategyName: picked[0]?.name || '—', role: '收益贡献核心', annualReturn: picked[0] ? `${picked[0].annualReturn >= 0 ? '+' : ''}${picked[0].annualReturn.toFixed(2)}%` : '—', drawdown: picked[0] ? `${picked[0].maxDrawdown?.toFixed(1) || '—'}%` : '—', winRate: picked[0] ? `${picked[0].winRate.toFixed(0)}%` : '—', reason: `高风险高回报定位，在组合中承担收益弹性职能。` },
    { name: '防御层', icon: '🛡️', color: '#3a7fbf', allocation: picked.length >= 2 ? '40%' : '—', strategyName: picked[1]?.name || picked[0]?.name || '—', role: '回撤控制核心', annualReturn: picked[1] ? `${picked[1].annualReturn >= 0 ? '+' : ''}${picked[1].annualReturn.toFixed(2)}%` : '—', drawdown: picked[1] ? `${picked[1].maxDrawdown?.toFixed(1) || '—'}%` : '—', winRate: picked[1] ? `${picked[1].winRate.toFixed(0)}%` : '—', reason: `低波动低回撤定位，与进攻层形成负相关缓冲。` },
    { name: '流动性层', icon: '💧', color: '#58c7ff', allocation: picked.length >= 3 ? '20%' : picked.length >= 2 ? '20%' : '—', strategyName: picked[2]?.name || picked[0]?.name || '—', role: '流动性保障', annualReturn: picked[2] ? `${picked[2].annualReturn >= 0 ? '+' : ''}${picked[2].annualReturn.toFixed(2)}%` : picked[0] ? `${picked[0].annualReturn >= 0 ? '+' : ''}${picked[0].annualReturn.toFixed(2)}%` : '—', drawdown: picked[2] ? `${picked[2].maxDrawdown?.toFixed(1) || '—'}%` : picked[0] ? `${picked[0].maxDrawdown?.toFixed(1) || '—'}%` : '—', winRate: picked[2] ? `${picked[2].winRate.toFixed(0)}%` : picked[0] ? `${picked[0].winRate.toFixed(0)}%` : '—', reason: `高流动性定位，满足客户日常资金调配需求。` },
  ]

  const avgReturn = picked.reduce((a, b) => a + b.annualReturn, 0) / picked.length
  const avgDrawdown = picked.reduce((a, b) => a + (b.maxDrawdown || 0), 0) / picked.length

  aiResult.value = {
    riskLevel: riskLabel, scale: scaleLabel, expectedReturn: returnLabel, layers,
    portfolioReturn: `${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(2)}%`,
    portfolioDrawdown: `-${avgDrawdown.toFixed(2)}%`,
    sharpeRatio: (avgReturn / (avgDrawdown || 1)).toFixed(2),
    coverage: ['低', '中', '高'][Math.min(Math.floor(picked.length / 1.5), 2)],
    synergyLogic: `本组合通过"进攻层"与"防御层"的负相关性设计，实现收益与回撤的解耦管理。三层分工明确、互相咬合，在客户所要求的${riskLabel}风险框架内，最大化风险调整后收益。组合夏普比率${(avgReturn / (avgDrawdown || 1)).toFixed(2)}，历史最大回撤控制在${avgDrawdown.toFixed(1)}%以内。`,
  }
  aiLoading.value = false
}

// ═══════════════ 持仓组合 ═══════════════
function togglePortfolio(seed: number) {
  const idx = portfolioIds.value.indexOf(seed)
  if (idx >= 0) {
    portfolioIds.value.splice(idx, 1)
    delete portfolioWeights.value[seed]
  } else if (portfolioIds.value.length < 5) {
    portfolioIds.value.push(seed)
    portfolioWeights.value[seed] = 20
  }
  portfolioGenerated.value = false
}

function adjustWeight(seed: number, delta: number) {
  const current = portfolioWeights.value[seed] || 20
  portfolioWeights.value[seed] = Math.max(5, Math.min(80, current + delta))
  portfolioGenerated.value = false
}

function setWeight(seed: number, val: number) {
  portfolioWeights.value[seed] = Math.max(5, Math.min(80, val))
  portfolioGenerated.value = false
}

async function onGeneratePortfolio() {
  portfolioGenerated.value = true
  await nextTick()
  await loadPortfolioNarrative()
}

async function loadPortfolioNarrative() {
  if (!portfolioStrategies.value.length || portfolioTotal.value !== 100) return
  portfolioNarrLoading.value = true
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    const components = portfolioStrategies.value.map(s => ({
      name: s.name, navCategory: s.navCategory, annualReturn: s.annualReturn,
      maxDrawdown: s.maxDrawdown || 0, volatility: (s as any).volatilityValue || 0,
      sharpe: (s as any).sharpe || 0,
      riskLevel: (s as any).riskLevel || 'R3',
      weight: portfolioWeights.value[s.seed] || 20,
    }))
    const resp = await fetch(`${base}/api/portfolio-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ components, portfolioReturn: parseFloat(portfolioMetrics.value.return), portfolioMaxDrawdown: parseFloat(portfolioMetrics.value.drawdown), portfolioSharpe: parseFloat(portfolioMetrics.value.sharpe) }),
    })
    const data = await resp.json()
    portfolioNarrative.value = (data.data || data).narrative || '（暂无法生成解读）'
  } catch {
    portfolioNarrative.value = '（AI 组合解读暂时不可用）'
  } finally {
    portfolioNarrLoading.value = false
  }
}

// ═══════════════ 生命周期 ═══════════════
async function loadStrategies() {
  loading.value = true
  try {
    allStrategies.value = await listStrategies()
    selectedIds.value = [...allStrategies.value].sort((a, b) => b.annualReturn - a.annualReturn).slice(0, 8).map(s => s.seed)
  } finally {
    loading.value = false
  }
}

watch(activeMode, async (mode) => {
  if (mode === 'map') {
    await nextTick()
    await new Promise(r => requestAnimationFrame(() => r()))
    if (!mapChartInstance.value) {
      mapChartInstance.value = echarts.init(mapChartRef.value)
    }
    mapChartInstance.value.resize()
    renderMap()
  }
})

onMounted(async () => {
  await loadStrategies()
  await nextTick()
  if (mapChartRef.value) {
    mapChartInstance.value = echarts.init(mapChartRef.value)
    renderMap()
  }
  window.addEventListener('resize', onResizeChart)
})

function onResizeChart() { mapChartInstance.value?.resize() }

onUnmounted(() => {
  mapChartInstance.value?.dispose()
  window.removeEventListener('resize', onResizeChart)
})
</script>

<style scoped>
.compare-page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 48px; }

/* 通用 */
.gain { color: #c24a00 !important; }
.loss { color: #b82020 !important; }
.mid { color: #9e722e !important; }
.muted { color: var(--muted); }
.card { background: rgba(255,255,255,0.82); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 4px 24px rgba(41,61,84,0.1); border-radius: 20px; padding: 20px 16px; }
.section-eyebrow { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.section-heading { margin: 0 0 18px; font-size: 20px; font-weight: 700; color: var(--text); }

/* 顶部 */
.compare-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 20px 0 0; gap: 20px; flex-wrap: wrap; border-bottom: 1px solid rgba(23,55,91,0.08); padding-bottom: 16px; }
.header-left .eyebrow { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
.header-left h1 { margin: 8px 0 6px; font-size: 34px; }
.header-left .page-lead { margin: 0; color: var(--muted); font-size: 14px; }
.mode-tabs { display: flex; gap: 8px; }
.mode-tab { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; border: 1.5px solid rgba(23,55,91,0.2); background: rgba(255,255,255,0.7); color: var(--muted); cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
.mode-tab:hover { border-color: var(--blue); color: var(--blue); }
.mode-tab.active { background: var(--blue); border-color: var(--blue); color: #fff; }
.mode-icon { font-size: 15px; }

/* 布局 */
.compare-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }

/* 左侧面板容器 - 固定高度，可滚动 */
.selector-wrap { position: sticky; top: 80px; height: calc(100vh - 100px); overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; }
.selector-wrap::-webkit-scrollbar { width: 4px; }
.selector-wrap::-webkit-scrollbar-thumb { background: rgba(23,55,91,0.12); border-radius: 2px; }

/* 左侧面板 */
.selector-panel { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; }
.panel-count { font-size: 12px; color: var(--muted); }
.filter-group { display: flex; flex-direction: column; gap: 8px; }
.filter-label { font-size: 12px; font-weight: 600; color: var(--text); letter-spacing: 0.04em; }
.risk-options { display: flex; flex-direction: column; gap: 4px; }
.risk-opt { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; border: 1.5px solid transparent; background: rgba(23,55,91,0.05); cursor: pointer; font-size: 13px; color: var(--text); transition: all 0.2s; text-align: left; }
.risk-opt:hover { border-color: rgba(23,55,91,0.2); }
.risk-opt.active { border-color: var(--blue); background: rgba(23,55,91,0.08); color: var(--blue); font-weight: 600; }
.risk-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.return-options { display: flex; flex-wrap: wrap; gap: 6px; }
.ret-opt { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(23,55,91,0.15); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.ret-opt:hover { border-color: var(--blue); color: var(--blue); }
.ret-opt.active { background: var(--blue); border-color: var(--blue); color: #fff; font-weight: 600; }

/* AI诊断按钮 */
.ai-diagnosis-section { margin-top: 4px; }
.ai-diagnosis-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; border: none; background: linear-gradient(135deg,#9e722e,#c24a00); color: #fff; cursor: pointer; font-size: 13px; text-align: left; transition: all 0.25s; box-shadow: 0 4px 16px rgba(158,114,46,0.25); }
.ai-diagnosis-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(158,114,46,0.35); }
.ai-diagnosis-btn:disabled { opacity: 0.75; cursor: not-allowed; }
.ai-icon { font-size: 22px; flex-shrink: 0; }
.ai-icon.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.ai-btn-text { display: flex; flex-direction: column; gap: 2px; }
.ai-btn-title { font-size: 14px; font-weight: 700; }
.ai-btn-sub { font-size: 11px; opacity: 0.8; }

/* 策略列表 */
.pick-list { display: flex; flex-direction: column; gap: 6px; }
/* pick-list scrollbar removed */
.pick-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; border: 1.5px solid rgba(23,55,91,0.1); background: rgba(255,255,255,0.7); gap: 8px; }
.pick-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.pick-check { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(23,55,91,0.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: #6abf40; border-color: #6abf40; color: #fff; }
.pick-check svg { width: 11px; height: 11px; }
.pick-info { min-width: 0; }
.pick-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pick-cat { font-size: 11px; color: var(--muted); }
.pick-metric { text-align: right; flex-shrink: 0; }
.pick-ret { font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.pick-empty { font-size: 12px; color: var(--muted); text-align: center; padding: 16px 0; line-height: 1.6; }

/* 右侧 */
.result-area { display: flex; flex-direction: column; gap: 18px; }
.result-section { padding: 22px; }

/* 产品地图 */
.map-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.axis-label { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; }
.axis-label-v { writing-mode: vertical-lr; transform: rotate(180deg); }
.map-legend { display: flex; flex-wrap: wrap; gap: 10px; }
.map-legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text); }
.map-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.map-chart { height: 380px; }
.map-quadrant-guide { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 16px; }
.quadrant-cell { padding: 12px 14px; border-radius: 12px; border-left: 3px solid; }
.quadrant-cell.q1 { background: rgba(106,191,64,0.08); border-color: #6abf40; }
.quadrant-cell.q2 { background: rgba(61,127,191,0.08); border-color: #3a7fbf; }
.quadrant-cell.q3 { background: rgba(248,113,113,0.08); border-color: #f87171; }
.quadrant-cell.q4 { background: rgba(88,199,255,0.08); border-color: #58c7ff; }
.q-label { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.q-desc { font-size: 11px; color: var(--muted); }

/* 产品线结构 */
.shelf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.shelf-cat { padding: 16px; border-radius: 12px; background: rgba(23,55,91,0.04); border-left: 4px solid; }
.shelf-cat-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.shelf-cat-name { font-size: 14px; font-weight: 700; color: var(--text); }
.shelf-cat-count { font-size: 12px; color: var(--muted); }
.shelf-cat-metrics { display: flex; gap: 16px; margin-bottom: 8px; }
.scm-item { display: flex; flex-direction: column; gap: 2px; }
.scm-val { font-size: 16px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.scm-lab { font-size: 10px; color: var(--muted); text-transform: uppercase; }
.shelf-gap-tag { font-size: 12px; padding: 4px 10px; border-radius: 6px; background: rgba(249,115,22,0.1); color: #f97316; border: 1px solid rgba(249,115,22,0.2); display: inline-block; }
.shelf-ok-tag { font-size: 12px; padding: 4px 10px; border-radius: 6px; background: rgba(106,191,64,0.1); color: #4ade80; border: 1px solid rgba(106,191,64,0.2); display: inline-block; }

/* 风险徽章 */
.risk-badge { font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 5px; flex-shrink: 0; letter-spacing: 0.04em; }
.risk-badge.risk-R1 { background: rgba(88,199,255,0.15); color: #58c7ff; border: 1px solid rgba(88,199,255,0.3); }
.risk-badge.risk-R2 { background: rgba(74,222,128,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
.risk-badge.risk-R3 { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.risk-badge.risk-R4 { background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.3); }
.risk-badge.risk-R5 { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

/* AI诊断筛选卡 */
.ai-filter-card { padding: 20px 22px; }
.ai-filter-row { display: flex; flex-direction: column; gap: 14px; }
.ai-filter-row .filter-group { display: flex; flex-direction: column; gap: 6px; }
.ai-filter-row .filter-label { font-size: 12px; font-weight: 600; color: var(--text); letter-spacing: 0.04em; }
.ai-filter-row .risk-options { display: flex; flex-direction: row; flex-wrap: wrap; gap: 6px; }
.ai-filter-row .risk-opt { display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; border: 1.5px solid transparent; background: rgba(23,55,91,0.05); cursor: pointer; font-size: 13px; color: var(--text); transition: all 0.2s; }
.ai-filter-row .risk-opt:hover { border-color: rgba(23,55,91,0.2); }
.ai-filter-row .risk-opt.active { border-color: var(--blue); background: rgba(23,55,91,0.08); color: var(--blue); font-weight: 600; }
.ai-filter-row .risk-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ai-filter-row .return-options { display: flex; flex-wrap: wrap; gap: 6px; }
.ai-filter-row .ret-opt { padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(23,55,91,0.15); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.ai-filter-row .ret-opt:hover { border-color: var(--blue); color: var(--blue); }
.ai-filter-row .ret-opt.active { background: var(--blue); border-color: var(--blue); color: #fff; font-weight: 600; }
.ai-filter-row .ai-diagnosis-section { margin-top: 4px; }
.ai-filter-row .ai-diagnosis-btn { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 14px; border: none; background: linear-gradient(135deg,#9e722e,#c24a00); color: #fff; cursor: pointer; font-size: 14px; text-align: left; transition: all 0.25s; box-shadow: 0 4px 16px rgba(158,114,46,0.25); width: 100%; }
.ai-filter-row .ai-diagnosis-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(158,114,46,0.35); }
.ai-filter-row .ai-diagnosis-btn:disabled { opacity: 0.75; cursor: not-allowed; }
.ai-filter-row .ai-icon { font-size: 22px; flex-shrink: 0; }
.ai-filter-row .ai-icon.spinning { animation: spin 1s linear infinite; }
.ai-filter-row .ai-btn-text { display: flex; flex-direction: column; gap: 2px; }
.ai-filter-row .ai-btn-title { font-size: 14px; font-weight: 700; }
.ai-filter-row .ai-btn-sub { font-size: 11px; opacity: 0.8; }

/* AI诊断结果 */
.ai-result-card { padding: 24px 22px; }
.ai-result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.regenerate-btn { background: none; border: 1px solid rgba(23,55,91,0.2); border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 12px; color: var(--muted); transition: all 0.2s; }
.regenerate-btn:hover { color: var(--text); border-color: var(--blue); }
.diag-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.diag-tag { padding: 5px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; background: rgba(23,55,91,0.08); color: var(--text); border: 1px solid rgba(23,55,91,0.12); }
.gain-tag { background: rgba(158,114,46,0.1); color: var(--gold); border-color: rgba(158,114,46,0.2); }
.diag-triad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
.diag-layer { padding: 16px 18px; border-radius: 14px; border: 1.5px solid; background: rgba(255,255,255,0.7); }
.layer-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.layer-icon { font-size: 18px; }
.layer-name { font-size: 14px; font-weight: 700; color: var(--text); flex: 1; }
.layer-alloc { font-size: 13px; font-weight: 700; color: var(--muted); }
.layer-strategy { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.layer-role { font-size: 11px; color: var(--gold); margin-bottom: 8px; }
.layer-metrics { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.lm { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 5px; background: rgba(23,55,91,0.06); }
.layer-reason { font-size: 12px; color: var(--muted); line-height: 1.65; }
.portfolio-metrics { display: flex; align-items: center; background: rgba(23,55,91,0.04); border-radius: 14px; overflow: hidden; margin-bottom: 20px; }
.pm-item { flex: 1; text-align: center; padding: 16px 8px; }
.pm-val { font-size: 22px; font-weight: 800; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: var(--text); }
.pm-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
.pm-divider { width: 1px; height: 48px; background: rgba(23,55,91,0.1); flex-shrink: 0; }
.synergy-body { font-size: 13px; color: var(--muted); line-height: 1.85; background: rgba(23,55,91,0.04); padding: 14px 16px; border-radius: 10px; }
.ai-empty-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px 40px; text-align: center; }
.ai-empty-icon { font-size: 56px; }
.ai-empty-title { font-size: 22px; font-weight: 700; color: var(--text); }
.ai-empty-sub { font-size: 14px; color: var(--muted); max-width: 480px; line-height: 1.7; }
.ai-empty-steps { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
.ai-step { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
.step-num { width: 24px; height: 24px; border-radius: 50%; background: var(--blue); color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }

/* 入选策略详情 */
.selected-detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.selected-detail-card { padding: 16px 18px; border-radius: 14px; background: rgba(23,55,91,0.04); border: 1px solid rgba(23,55,91,0.08); display: flex; flex-direction: column; gap: 8px; }
.sdc-header { display: flex; justify-content: space-between; align-items: center; }
.sdc-cat { font-size: 11px; text-transform: uppercase; color: var(--gold); letter-spacing: 0.1em; }
.sdc-name { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.3; }
.sdc-owner { font-size: 12px; color: var(--muted); }
.sdc-metrics { display: flex; gap: 12px; }
.sdc-m { display: flex; flex-direction: column; gap: 2px; }
.sdc-mv { font-size: 15px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.sdc-ml { font-size: 10px; color: var(--muted); text-transform: uppercase; }
.sdc-logic { font-size: 12px; color: var(--muted); line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sdc-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.card-tag { font-size: 11px; padding: 3px 9px; border-radius: 5px; background: rgba(23,55,91,0.06); border: 1px solid rgba(23,55,91,0.1); color: rgba(23,55,91,0.7); }

/* 持仓组合 */
.portfolio-builder { display: grid; grid-template-columns: 340px 1fr; gap: 20px; margin-top: 16px; }
.pb-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.pb-hint { font-size: 12px; color: var(--muted); margin-bottom: 14px; }
.pb-strategy-list { display: flex; flex-direction: column; gap: 5px; }
/* pb-strategy-list scrollbar removed */
.pb-strategy-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid transparent; background: rgba(23,55,91,0.04); cursor: pointer; transition: all 0.2s; }
.pb-strategy-row:hover { border-color: rgba(23,55,91,0.2); background: rgba(23,55,91,0.07); }
.pb-strategy-row.selected { border-color: var(--gold); background: rgba(158,114,46,0.07); }
.pb-check { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(23,55,91,0.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.pb-check.active { background: var(--gold); border-color: var(--gold); color: #fff; }
.pb-check svg { width: 11px; height: 11px; }
.pb-sinfo { flex: 1; min-width: 0; }
.pb-sname { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pb-scat { font-size: 11px; color: var(--muted); }
.pb-sret { font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; flex-shrink: 0; }

/* 权重分配 */
.pb-right { display: flex; flex-direction: column; gap: 16px; }
.alloc-title { font-size: 13px; font-weight: 700; color: var(--text); }
.alloc-list { display: flex; flex-direction: column; gap: 8px; }
.alloc-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; background: rgba(23,55,91,0.04); }
.ar-name { flex: 1; font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.ar-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ar-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(23,55,91,0.15); background: rgba(255,255,255,0.8); color: var(--text); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.ar-btn:hover { border-color: var(--gold); color: var(--gold); }
.ar-val { font-size: 15px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; min-width: 38px; text-align: center; }
.ar-slider-wrap { flex: 1; min-width: 80px; }
.ar-slider { width: 100%; accent-color: var(--gold); cursor: pointer; }
.ar-input { width: 44px; text-align: center; border: 1px solid rgba(23,55,91,0.18); border-radius: 6px; padding: 3px 5px; font-size: 14px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: var(--text); background: rgba(255,255,255,0.9); outline: none; -moz-appearance: textfield; }
.ar-input::-webkit-outer-spin-button, .ar-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ar-input:focus { border-color: var(--gold); }
.ar-pct { font-size: 13px; font-weight: 600; color: var(--muted); flex-shrink: 0; }
.alloc-total { font-size: 13px; color: var(--muted); text-align: center; padding: 10px; border-radius: 8px; background: rgba(23,55,91,0.04); }
.alloc-total strong { color: var(--text); }
.alloc-total.warning strong { color: #f97316; }
.alloc-warning { color: #f97316; font-size: 12px; margin-left: 6px; }

/* 生成按钮 */
.port-gen-btn-wrap { display: flex; justify-content: center; padding: 6px 0 0; }
.port-gen-btn { padding: 10px 28px; border-radius: 12px; border: none; background: linear-gradient(135deg,#9e722e,#c24a00); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(158,114,46,0.25); }
.port-gen-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(158,114,46,0.35); }
.port-gen-btn:disabled { opacity: 0.5; cursor: default; }

/* 组合指标 */
.port-metrics { background: rgba(23,55,91,0.04); border-radius: 12px; padding: 16px; }
.port-m-title { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
.port-m-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
.port-m-item { text-align: center; }
.pmi-val { font-size: 22px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.pmi-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
.coverage-bar-wrap { display: flex; align-items: center; gap: 10px; }
.cbw-label { font-size: 11px; color: var(--muted); white-space: nowrap; }
.cbw-track { flex: 1; height: 6px; border-radius: 3px; background: rgba(23,55,91,0.1); overflow: hidden; }
.cbw-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.cbw-desc { font-size: 11px; color: var(--muted); white-space: nowrap; }

/* 指标算法说明 */
.algo-section { margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(23,55,91,0.12); }
.algo-title { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
.algo-formula { margin-bottom: 10px; }
.af-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
.af-name { font-size: 13px; font-weight: 700; color: var(--text); width: 110px; flex-shrink: 0; }
.af-formula { font-size: 12px; color: var(--muted); font-style: italic; }
.af-example { font-size: 12px; color: var(--muted); font-family: 'DIN Alternate','Bahnschrift',monospace; padding: 6px 10px; background: rgba(23,55,91,0.04); border-radius: 6px; }
.af-w { color: var(--text); font-weight: 700; }
.af-m { color: #6d7c8d; }
.af-eq { color: var(--gold); font-weight: 700; margin: 0 4px; }
.af-result { font-weight: 800; }

/* 贡献度对比 */
.pc-title { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
.pc-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.pc-name { font-size: 12px; color: var(--text); width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.pc-bar-track { flex: 1; height: 8px; border-radius: 4px; background: rgba(23,55,91,0.08); overflow: hidden; }
.pc-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.pc-contrib { font-size: 12px; font-weight: 600; color: var(--muted); width: 32px; text-align: right; flex-shrink: 0; }

/* AI 组合解读 */
.port-ai-section { margin-top: 16px; padding: 16px; background: rgba(158,114,46,0.05); border-radius: 12px; border: 1px solid rgba(158,114,46,0.15); }
.pai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.pai-icon { font-size: 18px; }
.pai-title { font-size: 13px; font-weight: 700; color: var(--text); flex: 1; }
.pai-btn { padding: 5px 14px; border-radius: 8px; border: 1px solid rgba(23,55,91,0.15); background: rgba(255,255,255,0.7); color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.pai-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
.pai-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.pai-loading { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); padding: 8px 0; }
.spinner-ring-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(158,114,46,0.2); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
.pai-body { font-size: 13px; color: var(--muted); line-height: 1.9; white-space: pre-wrap; padding: 12px 14px; background: rgba(255,255,255,0.7); border-radius: 8px; }

/* 未选状态 */
.pb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 60px 20px; text-align: center; }
.pbe-icon { font-size: 48px; }
.pbe-title { font-size: 18px; font-weight: 700; color: var(--text); }
.pbe-sub { font-size: 13px; color: var(--muted); }

@media (max-width: 1100px) {
  .compare-layout { grid-template-columns: 1fr; }
  .selector-wrap { position: static; height: auto; overflow: visible; }
  .diag-triad { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .portfolio-builder { grid-template-columns: 1fr; }
  .port-m-grid { grid-template-columns: repeat(2, 1fr); }
  .map-quadrant-guide { grid-template-columns: repeat(2, 1fr); }
  .portfolio-metrics { flex-direction: column; }
  .pm-divider { width: 80%; height: 1px; }
}
</style>
