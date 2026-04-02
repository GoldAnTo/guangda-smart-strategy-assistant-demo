<template>
  <div class="page-shell advisor-page">

    <!-- 页面标题 -->
    <header class="advisor-header">
      <div class="ah-left">
        <div class="section-eyebrow">AI Advisor</div>
        <h1>策略推荐工作台</h1>
        <p class="page-lead">输入客户画像，AI即时生成策略配置建议，全程可解释、可追溯。</p>
      </div>
      <div class="ah-right">
        <div class="ah-stat">
          <span class="ah-val">{{ allStrategies.length }}</span>
          <span class="ah-label">条策略库</span>
        </div>
        <div class="ah-stat">
          <span class="ah-val">5维</span>
          <span class="ah-label">评分体系</span>
        </div>
      </div>
    </header>

    <!-- 主布局：左侧输入 + 右侧结果 -->
    <div class="advisor-layout">

      <!-- ═══════════════════════════════ -->
      <!-- 左侧：客户画像输入 -->
      <!-- ═══════════════════════════════ -->
      <aside class="profile-panel">

        <!-- 画像表单 -->
        <div class="profile-card card">
          <div class="pc-head">
            <div class="section-eyebrow">Client profile</div>
            <h2 class="pc-title">客户画像</h2>
            <p class="pc-desc">只需4项关键信息，即可生成配置建议</p>
          </div>

          <div class="pf-grid">
            <!-- 风险偏好 -->
            <div class="pf-item">
              <label class="pf-label">风险偏好</label>
              <div class="pf-options risk-options">
                <button
                  v-for="opt in riskOptions"
                  :key="opt.value"
                  class="pf-opt"
                  :class="{ active: form.riskLevel === opt.value }"
                  @click="form.riskLevel = opt.value"
                >
                  <span class="opt-icon">{{ opt.icon }}</span>
                  <span class="opt-label">{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- 投资期限 -->
            <div class="pf-item">
              <label class="pf-label">资金可用时间</label>
              <div class="pf-options horizon-options">
                <button
                  v-for="opt in horizonOptions"
                  :key="opt.value"
                  class="pf-opt"
                  :class="{ active: form.investmentHorizon === opt.value }"
                  @click="form.investmentHorizon = opt.value"
                >
                  <span class="opt-icon">{{ opt.icon }}</span>
                  <span class="opt-label">{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- 流动性需求 -->
            <div class="pf-item">
              <label class="pf-label">流动性要求</label>
              <div class="pf-options liquidity-options">
                <button
                  v-for="opt in liquidityOptions"
                  :key="opt.value"
                  class="pf-opt"
                  :class="{ active: form.liquidityNeed === opt.value }"
                  @click="form.liquidityNeed = opt.value"
                >
                  <span class="opt-icon">{{ opt.icon }}</span>
                  <span class="opt-label">{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- 收益目标 -->
            <div class="pf-item">
              <label class="pf-label">收益目标</label>
              <div class="pf-options return-options">
                <button
                  v-for="opt in returnOptions"
                  :key="opt.value"
                  class="pf-opt"
                  :class="{ active: form.returnExpectation === opt.value }"
                  @click="form.returnExpectation = opt.value"
                >
                  <span class="opt-icon">{{ opt.icon }}</span>
                  <span class="opt-label">{{ opt.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            class="analyze-btn"
            :disabled="!canAnalyze || analyzing"
            @click="handleAnalyze"
          >
            <span v-if="analyzing" class="spinner-sm"></span>
            <span v-else>🧠 智能分析匹配</span>
          </button>
        </div>

        <!-- 快速场景 -->
        <div class="quick-scenes card">
          <div class="qs-title">💡 快速场景</div>
          <div class="qs-list">
            <button
              v-for="scene in quickScenes"
              :key="scene.id"
              class="qs-btn"
              @click="applyScene(scene)"
            >
              <span class="qs-icon">{{ scene.icon }}</span>
              <span class="qs-name">{{ scene.name }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- ═══════════════════════════════ -->
      <!-- 右侧：推荐结果 -->
      <!-- ═══════════════════════════════ -->
      <main class="result-panel">

        <!-- 空状态 -->
        <div v-if="!hasSearched && !analyzing" class="empty-state card">
          <div class="empty-icon">🎯</div>
          <div class="empty-title">左侧填写客户画像</div>
          <div class="empty-sub">4项关键信息 → AI生成策略推荐</div>
        </div>

        <!-- AI分析过程（右侧，分析中显示） -->
        <div class="ai-steps-panel" v-if="analyzing">
          <div class="asp-title">AI 分析过程</div>
          <div class="asp-steps">
            <div
              v-for="(step, i) in aiSteps"
              :key="i"
              class="asp-step"
              :class="{ done: step.done, active: step.active }"
            >
              <div class="asp-icon">{{ step.icon }}</div>
              <div class="asp-text">{{ step.text }}</div>
            </div>
          </div>
        </div>

        <!-- 转人工提示 -->
        <div v-else-if="result?.shouldEscalate" class="escalation-card card">
          <div class="esc-icon">⚠️</div>
          <div class="esc-title">需要转人工服务</div>
          <div class="esc-reason">{{ result.escalationInfo?.reason }}</div>
          <div class="esc-sub">建议由客户经理进行一对一深度咨询</div>
        </div>

        <!-- 推荐结果 -->
        <template v-else-if="result">
          <!-- 结果摘要 -->
          <div class="result-summary card">
            <div class="rs-head">
              <div>
                <div class="section-eyebrow">AI Recommendation</div>
                <h2 class="rs-title">配置建议</h2>
              </div>
              <div class="rs-stats">
                <div class="rs-stat">
                  <span class="rs-n primary">{{ result.primaryCount }}</span>
                  <span class="rs-l">首选</span>
                </div>
                <div class="rs-stat">
                  <span class="rs-n alt">{{ result.alternativeCount }}</span>
                  <span class="rs-l">备选</span>
                </div>
                <div class="rs-stat">
                  <span class="rs-n caution">{{ result.cautionaryCount }}</span>
                  <span class="rs-l">了解</span>
                </div>
              </div>
            </div>
            <div class="rs-profile">
              <span class="rs-profile-tag">画像摘要</span>
              {{ result.profileSummary }}
            </div>
          </div>

          <!-- 合规风险提示 -->
          <div class="compliance-notice" v-if="hasSearched && result && !result.shouldEscalate">
            <div class="cn-icon">⚠️</div>
            <div class="cn-body">
              <div class="cn-title">重要提示</div>
              <div class="cn-text">
                本页面所展示的策略信息仅供参考，不构成任何投资建议。历史业绩不代表未来表现，投资有风险，决策需谨慎。请在做出任何投资决定前，仔细阅读产品说明书、风险揭示书及相关法律文件，并根据自身的风险承受能力、投资目标和经济状况进行独立判断。
              </div>
              <div class="cn-divider"></div>
              <div class="cn-sub">如有疑问，请联系您的客户经理或拨打光大资管官方客服热线。</div>
            </div>
          </div>

          <!-- AI Narrative -->
          <div class="narrative-card card" v-if="narrative || narrativeLoading">
            <div class="nc-head">
              <span class="nc-icon">🧠</span>
              <span class="nc-title">AI 对比分析</span>
              <button class="nc-refresh" @click="regenerateNarrative" :disabled="narrativeLoading">
                {{ narrativeLoading ? '生成中...' : '🔄 更新' }}
              </button>
            </div>
            <div class="nc-body" v-if="narrative">{{ narrative }}</div>
            <div class="nc-loading" v-else-if="narrativeLoading">
              <span class="spinner-sm"></span> AI 正在生成分析...
            </div>
          </div>

          <!-- AI 归因分析 -->
          <div class="attribution-card card" v-if="hasSearched && !result?.shouldEscalate && primaryRecs.length">
            <div class="nc-head">
              <span class="nc-icon">🔬</span>
              <span class="nc-title">AI 策略归因分析</span>
              <button class="nc-refresh" @click="loadAttribution" :disabled="attributionLoading">
                {{ attributionLoading ? '分析中...' : attributionResult ? '🔄 重新分析' : '🚀 生成分析' }}
              </button>
            </div>

            <!-- 策略选择 -->
            <div class="attr-strategy-pick" v-if="!attributionResult">
              <div class="asp-hint">选择要分析的首选策略：</div>
              <div class="asp-options">
                <button
                  v-for="item in primaryRecs.slice(0, 3)"
                  :key="item.strategy.id"
                  class="asp-opt"
                  :class="{ active: attributionStrategyId === item.strategy.id }"
                  @click="attributionStrategyId = item.strategy.id; loadAttribution()"
                >
                  {{ item.strategy.name }}
                </button>
              </div>
            </div>

            <!-- 归因结果 -->
            <div class="attr-result" v-if="attributionResult">
              <div class="attr-meta">
                <span class="attr-strategy-name">{{ attributionResult.strategyName }}</span>
                <span class="attr-period">{{ attributionResult.period }}</span>
                <span class="attr-return" :class="attributionResult.periodReturn >= 0 ? 'gain' : 'loss'">
                  {{ attributionResult.periodReturn >= 0 ? '+' : '' }}{{ attributionResult.periodReturn.toFixed(2) }}%
                </span>
              </div>
              <div class="attr-analysis">{{ attributionResult.analysis }}</div>
            </div>

            <div class="nc-loading" v-else-if="attributionLoading">
              <span class="spinner-sm"></span> AI 正在深度分析策略归因...
            </div>

            <div class="attr-empty" v-else>
              <div class="ae-hint">点击上方按钮，AI 将深度分析策略的收益来源与风险驱动因素</div>
            </div>
          </div>

          <!-- 分层推荐列表 -->
          <div class="rec-sections">
            <!-- 首选推荐 -->
            <div v-if="primaryRecs.length" class="rec-section">
              <div class="rs-section-title primary-title">
                <span class="rst-icon">⭐</span>
                <span>首选推荐</span>
                <span class="rst-count">{{ primaryRecs.length }}条</span>
              </div>
              <div class="rec-list">
                <div
                  v-for="item in primaryRecs"
                  :key="item.strategy.id"
                  class="rec-card primary-card card"
                  @click="goDetail(item.strategy.id)"
                >
                  <div class="rc-top">
                    <div class="rc-name">{{ item.strategy.name }}</div>
                    <div class="rc-cat">{{ item.strategy.navCategory }}</div>
                    <div class="rc-score">
                      <span class="score-val">{{ item.matchScore }}</span>
                      <span class="score-max">/100</span>
                    </div>
                  </div>
                  <div class="rc-metrics">
                    <div class="rc-metric">
                      <span class="rc-mv gain">{{ item.strategy.annualReturn != null ? ((item.strategy.annualReturn >= 0 ? '+' : '') + item.strategy.annualReturn.toFixed(2) + '%') : '—' }}</span>
                      <span class="rc-ml">年化收益</span>
                    </div>
                    <div class="rc-metric">
                      <span class="rc-mv">{{ item.strategy.winRate != null ? item.strategy.winRate.toFixed(0) + '%' : '—' }}</span>
                      <span class="rc-ml">胜率</span>
                    </div>
                    <div class="rc-metric">
                      <span class="rc-mv">{{ item.strategy.riskLevelDisplay }}</span>
                      <span class="rc-ml">风险等级</span>
                    </div>
                    <div class="rc-metric">
                      <span class="rc-mv">{{ item.strategy.investmentHorizonDisplay }}</span>
                      <span class="rc-ml">投资期限</span>
                    </div>
                                    <div class="rc-tags">
                    <span class="rtag risk" :class="'risk-' + (item.strategy.riskLevel || '')">{{ item.strategy.riskLevelDisplay || item.strategy.riskLevel }}</span>
                    <span class="rtag horizon" v-if="item.strategy.investmentHorizonDisplay">{{ item.strategy.investmentHorizonDisplay }}</span>
                    <span class="rtag cat" v-if="item.strategy.navCategory">{{ item.strategy.navCategory }}</span>
                  </div>
                  <div class="rc-reasons">
                    <span
                      v-for="reason in item.matchReasons.slice(0, 3)"
                      :key="reason"
                      class="rc-reason-tag"
                    >{{ reason }}</span>
                  </div>
                  <div class="rc-actions">
                    <div class="rc-ai-hint">AI 综合评分</div>
                    <div class="rc-bar-track">
                      <div class="rc-bar-fill primary-fill" :style="{ width: item.matchScore + '%' }"></div>
                    </div>
                    <div class="rc-cta">查看详情 →</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 备选推荐 -->
            <div v-if="alternativeRecs.length" class="rec-section">
              <div class="rs-section-title alt-title">
                <span class="rst-icon">💡</span>
                <span>备选关注</span>
                <span class="rst-count">{{ alternativeRecs.length }}条</span>
              </div>
              <div class="rec-list compact">
                <div
                  v-for="item in alternativeRecs"
                  :key="item.strategy.id"
                  class="rec-card alt-card card"
                  @click="goDetail(item.strategy.id)"
                >
                  <div class="rc-top">
                    <div class="rc-name">{{ item.strategy.name }}</div>
                    <div class="rc-cat">{{ item.strategy.navCategory }}</div>
                    <div class="rc-score">
                      <span class="score-val alt">{{ item.matchScore }}</span>
                      <span class="score-max">/100</span>
                    </div>
                  </div>
                  <div class="rc-metrics compact-metrics">
                    <div class="rc-metric">
                      <span class="rc-mv gain">{{ item.strategy.annualReturn != null ? ((item.strategy.annualReturn >= 0 ? '+' : '') + item.strategy.annualReturn.toFixed(2) + '%') : '—' }}</span>
                      <span class="rc-ml">年化</span>
                    </div>
                    <div class="rc-metric">
                      <span class="rc-mv">{{ item.strategy.riskLevelDisplay }}</span>
                      <span class="rc-ml">风险</span>
                    </div>
                    <div class="rc-metric">
                      <span class="rc-mv">{{ item.strategy.investmentHorizonDisplay }}</span>
                      <span class="rc-ml">期限</span>
                    </div>
                  </div>
                  <div class="rc-cta-sm">查看详情 →</div>
                </div>
              </div>
            </div>

            <!-- 了解即可 -->
            <div v-if="cautionaryRecs.length" class="rec-section">
              <div class="rs-section-title caution-title">
                <span class="rst-icon">📌</span>
                <span>了解即可</span>
                <span class="rst-count">{{ cautionaryRecs.length }}条</span>
              </div>
              <div class="rec-list tiny">
                <div
                  v-for="item in cautionaryRecs"
                  :key="item.strategy.id"
                  class="rec-tiny card"
                  @click="goDetail(item.strategy.id)"
                >
                  <span class="rt-name">{{ item.strategy.name }}</span>
                  <span class="rt-cat">{{ item.strategy.navCategory }}</span>
                  <span class="rt-score">{{ item.matchScore }}分</span>
                </div>
              </div>
            </div>
          </div>
        </template>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listStrategies, type StrategyItem } from '../services/strategy'

const router = useRouter()

// ── Form ──────────────────────────────────────────────
const form = ref({
  riskLevel: 'stable',
  investmentHorizon: 'medium_term',
  liquidityNeed: 'medium',
  returnExpectation: 'stable_enhancement',
})

const canAnalyze = computed(() =>
  Boolean(form.value.riskLevel && form.value.investmentHorizon && form.value.liquidityNeed && form.value.returnExpectation)
)

// ── Options ───────────────────────────────────────────
const riskOptions = [
  { value: 'conservative', label: '保守型', icon: '🛡️' },
  { value: 'stable', label: '稳健型', icon: '⚖️' },
  { value: 'balanced', label: '平衡型', icon: '📊' },
  { value: 'growth', label: '进取型', icon: '🚀' },
  { value: 'highRisk', label: '高风险', icon: '💰' },
]

const horizonOptions = [
  { value: 'short_term', label: '半年内', icon: '⚡' },
  { value: 'medium_term', label: '半年至2年', icon: '📅' },
  { value: 'long_term', label: '2年以上', icon: '🏦' },
]

const liquidityOptions = [
  { value: 'high', label: '随时要用', icon: '💧' },
  { value: 'medium', label: '3-6个月', icon: '💦' },
  { value: 'low', label: '1年以上不动', icon: '🧊' },
]

const returnOptions = [
  { value: 'capital_stability', label: '本金保障', icon: '🔒' },
  { value: 'stable_enhancement', label: '稳健增值', icon: '📈' },
  { value: 'balanced', label: '收益平衡', icon: '⚖️' },
  { value: 'balanced_growth', label: '稳健成长', icon: '🌱' },
  { value: 'growth', label: '追求高收益', icon: '🚀' },
  { value: 'absolute_return', label: '绝对收益', icon: '🎯' },
  { value: 'alternative_return', label: '低相关性', icon: '🧩' },
]

const quickScenes = [
  { id: 1, name: '50岁稳健型客户', icon: '👤', form: { riskLevel: 'stable', investmentHorizon: 'medium_term', liquidityNeed: 'medium', returnExpectation: 'stable_enhancement' } },
  { id: 2, name: '40岁进取型客户', icon: '👤', form: { riskLevel: 'growth', investmentHorizon: 'medium_term', liquidityNeed: 'medium', returnExpectation: 'growth' } },
  { id: 3, name: '60岁保守型客户', icon: '👤', form: { riskLevel: 'conservative', investmentHorizon: 'short_term', liquidityNeed: 'high', returnExpectation: 'capital_stability' } },
  { id: 4, name: '高净值平衡型', icon: '💎', form: { riskLevel: 'balanced', investmentHorizon: 'long_term', liquidityNeed: 'low', returnExpectation: 'balanced' } },
]

// ── State ─────────────────────────────────────────────
const analyzing = ref(false)
const hasSearched = ref(false)
const allStrategies = ref<StrategyItem[]>([])
const result = ref<any>(null)
const narrative = ref('')
const narrativeLoading = ref(false)

// 归因分析状态
const attributionStrategyId = ref<number | null>(null)
const attributionResult = ref<any>(null)
const attributionLoading = ref(false)

// AI steps
const aiSteps = ref([
  { icon: '🔍', text: '理解客户需求', done: false, active: false },
  { icon: '📊', text: '扫描策略库', done: false, active: false },
  { icon: '⚖️', text: '评估风险收益', done: false, active: false },
  { icon: '🔬', text: '对比基准表现', done: false, active: false },
  { icon: '🧠', text: '综合排名', done: false, active: false },
  { icon: '✅', text: '生成推荐', done: false, active: false },
])

// ── Computed results ─────────────────────────────────
const primaryRecs = computed(() =>
  (result.value?.recommendations || []).filter((r: any) => r.priority === 'primary')
)
const alternativeRecs = computed(() =>
  (result.value?.recommendations || []).filter((r: any) => r.priority === 'alternative')
)
const cautionaryRecs = computed(() =>
  (result.value?.recommendations || []).filter((r: any) => r.priority === 'cautionary')
)

// ── Actions ───────────────────────────────────────────
function applyScene(scene: any) {
  Object.assign(form.value, scene.form)
}

async function handleAnalyze() {
  if (!canAnalyze.value || analyzing.value) return
  analyzing.value = true
  hasSearched.value = true

  // Reset steps
  aiSteps.value.forEach(s => { s.done = false; s.active = false })

  // Animate steps sequentially
  for (let i = 0; i < aiSteps.value.length; i++) {
    aiSteps.value[i].active = true
    aiSteps.value[i].done = true
    await new Promise(r => setTimeout(r, 400))
  }
  aiSteps.value.forEach(s => s.active = false)

  try {
    const base = (() => {
    const env = import.meta.env.VITE_API_BASE_URL
    if (env && env.startsWith('http')) return env
    return window.location.origin
  })()
    const resp = await fetch(`${base}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    const data = await resp.json()
    result.value = data.data || data
    // Auto-load narrative for top strategies
    if (result.value?.recommendations?.length && !result.value.shouldEscalate) {
      await regenerateNarrative()
      // Auto-load attribution for the top primary strategy
      const primary = primaryRecs.value[0]
      if (primary) {
        attributionStrategyId.value = primary.strategy.id
        await loadAttribution()
      }
    }
  } catch (e) {
    console.error('analyze error:', e)
    result.value = null
  } finally {
    analyzing.value = false
  }
}

async function regenerateNarrative() {
  const strategies = (result.value?.recommendations || []).slice(0, 4).map((r: any) => r.strategy)
  if (!strategies.length) return
  narrativeLoading.value = true
  try {
    const base = (() => { const env = import.meta.env.VITE_API_BASE_URL; return (env && env.startsWith('http')) ? env : window.location.origin })()
    const resp = await fetch(`${base}/api/recommend-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategies }),
    })
    const data = await resp.json()
    narrative.value = (data.data || data).narrative || '（暂无法生成分析）'
  } catch {
    narrative.value = '（AI 分析暂时不可用）'
  } finally {
    narrativeLoading.value = false
  }
}

function goDetail(id: string) {
  router.push(`/product/${id}`)
}

async function loadAttribution() {
  if (!attributionStrategyId.value || attributionLoading.value) return
  attributionLoading.value = true
  attributionResult.value = null
  try {
    const item = primaryRecs.value.find((r: any) => r.strategy.id === attributionStrategyId.value)
    if (!item) return
    const base = (() => { const env = import.meta.env.VITE_API_BASE_URL; return (env && env.startsWith('http')) ? env : window.location.origin })()
    const resp = await fetch(`${base}/api/attribution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy: item.strategy }),
    })
    const data = await resp.json()
    attributionResult.value = data.data || data
  } catch {
    attributionResult.value = { analysis: '（归因分析暂时不可用）', strategyName: '', period: '近一月', periodReturn: 0 }
  } finally {
    attributionLoading.value = false
  }
}

onMounted(async () => {
  try {
    allStrategies.value = await listStrategies()
  } catch { /* ignore */ }
})
</script>

<style scoped>
.advisor-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 60px;
}

/* Header */
.advisor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0 0;
}
.ah-left { display: flex; flex-direction: column; gap: 6px; }
.advisor-header h1 { margin: 8px 0 0; font-size: 34px; }
.advisor-header .page-lead { margin: 0; color: var(--muted); font-size: 14px; }
.ah-right { display: flex; gap: 20px; align-items: center; padding-top: 8px; }
.ah-stat { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.ah-val { font-size: 28px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: var(--blue); }
.ah-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }

/* Layout */
.advisor-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
  align-items: start;
}
.profile-panel {
  /* 自然内容高度，不裁断 */
}
.result-panel {
  /* 自然内容高度，不裁断 */
}

/* AI Steps */
.ai-steps-panel {
  background: rgba(255,252,246,0.84);
  border: 1px solid rgba(23,55,91,0.08);
  border-radius: 20px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.asp-title { font-size: 12px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; }
.asp-steps { display: flex; flex-direction: column; gap: 10px; }
.asp-step { display: flex; align-items: center; gap: 10px; opacity: 0.35; transition: opacity 0.4s ease; }
.asp-step.done { opacity: 1; }
.asp-step.active .asp-icon { box-shadow: 0 0 10px rgba(158,114,46,0.4); border-color: var(--gold); background: rgba(158,114,46,0.12); }
.asp-icon { font-size: 18px; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid rgba(23,55,91,0.15); display: flex; align-items: center; justify-content: center; transition: all 0.3s; flex-shrink: 0; }
.asp-text { font-size: 13px; color: var(--muted); }
.asp-step.done .asp-text { color: var(--text); font-weight: 600; }

/* Profile Card */
.profile-card { padding: 22px; }
.pc-head { margin-bottom: 20px; }
.pc-title { margin: 6px 0 4px; font-size: 20px; font-weight: 700; }
.pc-desc { margin: 0; color: var(--muted); font-size: 13px; }
.pf-grid { display: flex; flex-direction: column; gap: 18px; margin-bottom: 20px; }
.pf-label { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }
.pf-options { display: flex; flex-wrap: wrap; gap: 6px; }
.pf-opt { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px; border: 1.5px solid rgba(23,55,91,0.12); background: rgba(255,255,255,0.7); cursor: pointer; font-size: 13px; color: var(--text); transition: all 0.2s; }
.pf-opt:hover { border-color: rgba(23,55,91,0.3); background: rgba(255,255,255,0.95); }
.pf-opt.active { border-color: var(--gold); background: rgba(158,114,46,0.08); color: var(--gold); font-weight: 600; }
.opt-icon { font-size: 15px; }

/* Analyze Button */
.analyze-btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #9e722e, #c24a00);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(158,114,46,0.25);
}
.analyze-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(158,114,46,0.35); }
.analyze-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Quick Scenes */
.quick-scenes { padding: 18px 20px; }
.qs-title { font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 12px; }
.qs-list { display: flex; flex-direction: column; gap: 8px; }
.qs-btn { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(23,55,91,0.08); background: rgba(255,255,255,0.7); cursor: pointer; text-align: left; transition: all 0.2s; }
.qs-btn:hover { background: rgba(255,255,255,0.95); border-color: rgba(23,55,91,0.2); }
.qs-icon { font-size: 18px; }
.qs-name { font-size: 13px; color: var(--text); font-weight: 600; }

/* Result Panel */
.result-panel { display: flex; flex-direction: column; gap: 16px; }

/* Empty State */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 40px; text-align: center; }
.empty-icon { font-size: 56px; }
.empty-title { font-size: 22px; font-weight: 700; color: var(--text); }
.empty-sub { color: var(--muted); font-size: 14px; }

/* Escalation */
.escalation-card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 40px; text-align: center; background: rgba(229,163,71,0.08); border-color: rgba(229,163,71,0.2); }
.esc-icon { font-size: 48px; }
.esc-title { font-size: 22px; font-weight: 700; color: #c24a00; }
.esc-reason { color: var(--text); font-size: 15px; }
.esc-sub { color: var(--muted); font-size: 13px; }

/* Result Summary */
.result-summary { padding: 22px 24px; }
.rs-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.rs-title { margin: 6px 0 0; font-size: 20px; font-weight: 700; }
.rs-stats { display: flex; gap: 16px; }
.rs-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.rs-n { font-size: 28px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.rs-n.primary { color: #4ade80; }
.rs-n.alt { color: #58c7ff; }
.rs-n.caution { color: #e5a347; }
.rs-l { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
.rs-profile { font-size: 13px; color: var(--muted); line-height: 1.7; padding: 12px 14px; background: rgba(23,55,91,0.04); border-radius: 10px; }
.rs-profile-tag { display: inline-block; font-size: 11px; font-weight: 700; color: var(--gold); background: rgba(158,114,46,0.1); padding: 2px 8px; border-radius: 6px; margin-right: 8px; text-transform: uppercase; letter-spacing: 0.08em; }

/* Narrative */
.narrative-card { padding: 20px 22px; }
.nc-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.nc-icon { font-size: 20px; }
.nc-title { font-size: 14px; font-weight: 700; color: var(--text); flex: 1; }
.nc-refresh { background: none; border: 1px solid rgba(23,55,91,0.15); color: var(--muted); padding: 4px 10px; border-radius: 8px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
.nc-refresh:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
.nc-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.nc-body { font-size: 14px; color: var(--text); line-height: 1.9; white-space: pre-wrap; background: rgba(255,255,255,0.5); padding: 14px 16px; border-radius: 10px; }
.nc-loading { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; }

/* Recommendation Sections */
.rec-sections { display: flex; flex-direction: column; gap: 20px; }
.rec-section { display: flex; flex-direction: column; gap: 12px; }
.rs-section-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; padding-bottom: 8px; border-bottom: 2px solid; }
.primary-title { color: #4ade80; border-color: rgba(74,222,128,0.3); }
.alt-title { color: #58c7ff; border-color: rgba(88,199,255,0.3); }
.caution-title { color: #e5a347; border-color: rgba(229,163,71,0.3); }
.rst-count { margin-left: auto; font-size: 12px; font-weight: 400; color: var(--muted); }

/* Primary Cards */
.rec-list { display: flex; flex-direction: column; gap: 12px; }
.rec-card { padding: 18px 20px; cursor: pointer; transition: all 0.2s ease; }
.rec-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.primary-card { border-left: 4px solid #4ade80; }
.alt-card { border-left: 4px solid #58c7ff; }
.rc-top { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
.rc-name { font-size: 18px; font-weight: 700; color: var(--text); flex: 1; }
.rc-cat { font-size: 12px; color: var(--muted); }
.rc-score { display: flex; align-items: baseline; gap: 2px; flex-shrink: 0; }
.score-val { font-size: 22px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: #4ade80; }
.score-val.alt { color: #58c7ff; }
.score-max { font-size: 13px; color: var(--muted); font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.rc-metrics { display: flex; gap: 16px; margin-bottom: 12px; }
.rc-metric { display: flex; flex-direction: column; gap: 2px; }
.rc-mv { font-size: 15px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: var(--text); }
.rc-mv.gain { color: #c24a00; }
.rc-ml { font-size: 11px; color: var(--muted); }
.compact-metrics { gap: 12px; }
.rc-reasons { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.rc-reason-tag { font-size: 12px; padding: 4px 10px; border-radius: 8px; background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); color: #4ade80; }
.rc-actions { display: flex; align-items: center; gap: 12px; }
.rc-ai-hint { font-size: 12px; color: var(--muted); flex-shrink: 0; }
.rc-bar-track { flex: 1; height: 6px; background: rgba(23,55,91,0.08); border-radius: 999px; overflow: hidden; }
.rc-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.primary-fill { background: linear-gradient(90deg, #4ade80, #6bf79a); }
.rc-cta { font-size: 13px; color: var(--blue); font-weight: 600; flex-shrink: 0; }
.rc-cta-sm { font-size: 12px; color: var(--muted); }

/* Compact & Tiny */
.rec-list.compact .rc-top { margin-bottom: 8px; }
.rec-list.compact .rc-reasons { display: none; }
.rec-list.compact .rc-actions { display: none; }
.rec-list.compact .rc-cta-sm { display: block; }
.rc-cta-sm { display: none; }

.rec-list.tiny { flex-direction: row; flex-wrap: wrap; gap: 8px; }
.rec-tiny { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-left: 3px solid rgba(229,163,71,0.3); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
.rec-tiny:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
.rt-name { font-size: 14px; font-weight: 600; color: var(--text); }
.rt-cat { font-size: 12px; color: var(--muted); }
.rt-score { font-size: 13px; color: #e5a347; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; margin-left: auto; }

/* Spinner */
.spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Colors */
.gain { color: #c24a00 !important; }
.neutral { color: var(--muted) !important; }

/* Responsive */
@media (max-width: 1100px) {
  .advisor-layout { grid-template-columns: 1fr; }
}
/* Compliance Notice */
.compliance-notice {
  display: flex; gap: 14px;
  padding: 18px 20px;
  background: rgba(23,55,91,0.04);
  border: 1px solid rgba(23,55,91,0.12);
  border-radius: 14px;
  margin-top: 8px;
}
.cn-icon { font-size: 22px; flex-shrink: 0; padding-top: 2px; }
.cn-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.cn-title { font-size: 13px; font-weight: 700; color: var(--text); }
.cn-text { font-size: 12px; color: var(--muted); line-height: 1.85; }
.cn-divider { height: 1px; background: rgba(23,55,91,0.08); }
.cn-sub { font-size: 11px; color: var(--muted); line-height: 1.6; }

@media (max-width: 700px) {
  .advisor-header { flex-direction: column; gap: 16px; }
  .ah-right { align-self: flex-start; }
  .advisor-header h1 { font-size: 26px; }
}

/* ── AI 归因分析 ── */
.attribution-card {
  padding: 20px;
}
.attr-strategy-pick { margin: 12px 0 0; }
.asp-hint { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.asp-options { display: flex; flex-wrap: wrap; gap: 6px; }
.asp-opt {
  padding: 6px 14px; border-radius: 999px;
  border: 1px solid rgba(23,55,91,0.15);
  background: transparent; color: var(--muted);
  cursor: pointer; font-size: 12px; transition: all 0.2s;
}
.asp-opt:hover { border-color: var(--gold); color: var(--text); }
.asp-opt.active { border-color: var(--gold); background: rgba(158,114,46,0.1); color: var(--gold); font-weight: 600; }

.attr-result { margin-top: 14px; }
.attr-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.attr-strategy-name { font-size: 13px; font-weight: 700; color: var(--text); }
.attr-period { font-size: 11px; color: var(--muted); padding: 2px 8px; border-radius: 6px; background: rgba(23,55,91,0.06); }
.attr-return { font-size: 14px; font-weight: 800; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.attr-analysis {
  font-size: 13px; color: var(--muted); line-height: 1.9;
  padding: 14px 16px; border-radius: 10px;
  background: rgba(23,55,91,0.04); white-space: pre-wrap;
}

.attr-empty { margin-top: 14px; }
.ae-hint { font-size: 12px; color: var(--muted); text-align: center; padding: 12px; line-height: 1.7; }


/* 推荐卡片定位标签 */
.rc-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.rtag {
  font-size: 10.5px; padding: 2px 7px; border-radius: 999px; font-weight: 600;
  border: 1px solid; letter-spacing: 0.02em;
}
.rtag.risk.risk-R1 { color: #166534; border-color: #22c55e; background: rgba(34,197,94,0.08); }
.rtag.risk.risk-R2 { color: #1e40af; border-color: #3b82f6; background: rgba(59,130,246,0.08); }
.rtag.risk.risk-R3 { color: #92400e; border-color: #f59e0b; background: rgba(245,158,11,0.08); }
.rtag.risk.risk-R4 { color: #9f1239; border-color: #f43f5e; background: rgba(244,63,94,0.08); }
.rtag.risk.risk-R5 { color: #581c87; border-color: #a855f7; background: rgba(168,85,247,0.08); }
.rtag.horizon { color: var(--blue); border-color: rgba(23,55,91,0.2); background: rgba(23,55,91,0.05); }
.rtag.cat { color: #6b4226; border-color: rgba(107,66,38,0.2); background: rgba(107,66,38,0.06); }

</style>
