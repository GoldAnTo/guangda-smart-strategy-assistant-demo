<template>
  <div class="page-shell home-page">

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 顶部标题区 -->
    <!-- ═══════════════════════════════════════════════ -->
    <header class="home-header">
      <div class="header-left">
        <div class="eyebrow">光大资管 · 策略研究平台</div>
        <h1>策略目录</h1>
        <p class="page-lead">{{ allStrategies.length }} 条策略 · 覆盖 {{ categoryCount }} 大资产类别</p>
      </div>
      <div class="header-right">
        <div class="h-stat">
          <span class="h-val gain">{{ avgReturn }}</span>
          <span class="h-label">平均年化</span>
        </div>
        <div class="h-stat">
          <span class="h-val">{{ avgWinRate }}</span>
          <span class="h-label">平均胜率</span>
        </div>
        <div class="h-actions">
          <button class="advisor-cta" @click="goAdvisor">
            <span>🧠</span> AI顾问工作台
          </button>
          <button class="exhibition-btn" @click="goExhibition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            展览模式
          </button>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 策略体系总览 -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="strategy-overview" v-if="!loading && !error">
      <div class="so-inner">
        <div class="so-left">
          <div class="so-eyebrow">Strategy System</div>
          <h2 class="so-heading">光大资管策略体系</h2>
          <p class="so-desc">覆盖股票多头、量化对冲、固定收益三大核心资产类别，基于多因子模型、量化选股和资产配置框架构建，追求穿越周期的稳健超额收益。</p>
        </div>
        <div class="so-right">
          <div class="so-stat-grid">
            <div class="sos-item">
              <div class="sos-num">{{ allStrategies.length }}</div>
              <div class="sos-label">在架策略</div>
            </div>
            <div class="sos-item">
              <div class="sos-num">{{ categoryCount }}</div>
              <div class="sos-label">资产类别</div>
            </div>
            <div class="sos-item">
              <div class="sos-num">{{ avgReturn }}%</div>
              <div class="sos-label">平均年化收益</div>
            </div>
            <div class="sos-item">
              <div class="sos-num gain">{{ avgWinRate }}%</div>
              <div class="sos-label">平均胜率</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 分类概览标签（简化版，只显示名称） -->
    <!-- ═══════════════════════════════════════════════ -->
    <section class="cat-overview" v-if="!loading && !error">
      <div
        v-for="cat in categoriesWithStrategies"
        :key="cat.name"
        class="cat-ov-tag"
        :class="{ active: activeCat === cat.name }"
        @click="toggleCategory(cat.name)"
      >
        <span class="cot-name">{{ cat.name }}</span>
        <span class="cot-count">{{ cat.count }}条</span>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 风险等级说明 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="risk-legend">
      <span class="risk-legend-title">风险等级说明：</span>
      <span class="risk-badge risk-R1">R1</span><span class="risk-desc">低风险</span>
      <span class="risk-badge risk-R2">R2</span><span class="risk-desc">中低风险</span>
      <span class="risk-badge risk-R3">R3</span><span class="risk-desc">中等风险</span>
      <span class="risk-badge risk-R4">R4</span><span class="risk-desc">中高风险</span>
      <span class="risk-badge risk-R5">R5</span><span class="risk-desc">高风险</span>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 搜索 + 排序 + 筛选 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="controls-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="searchText" class="search-input" placeholder="搜索策略名称、负责人、标签..." />
        <button v-if="searchText" class="search-clear" @click="searchText = ''">×</button>
      </div>
      <div class="sort-tabs">
        <span class="sort-label">排序：</span>
        <button v-for="s in sortOptions" :key="s.key"
          class="sort-btn" :class="{ active: sortKey === s.key }"
          @click="sortKey = s.key">{{ s.label }}</button>
      </div>
      <div class="risk-filter">
        <span class="sort-label">风险：</span>
        <button
          v-for="r in riskFilters"
          :key="r.value"
          class="risk-btn"
          :class="{ active: activeRisk === r.value }"
          @click="activeRisk = activeRisk === r.value ? '' : r.value"
        >{{ r.label }}</button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 加载中 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 8" :key="n" class="skeleton-card"></div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 错误 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-else-if="error" class="error-card card">
      <div class="error-icon">⚠️</div>
      <div class="error-msg">{{ error }}</div>
      <button class="retry-btn" @click="loadStrategies">重新加载</button>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 策略展示区 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-else>

      <!-- 结果数量提示 -->
      <div class="result-bar" v-if="filteredStrategies.length">
        <span class="result-count">{{ filteredStrategies.length }} 条策略</span>
        <button v-if="activeCat || searchText || activeRisk" class="reset-btn" @click="resetFilters">
          重置筛选 ×
        </button>
      </div>

      <!-- 策略网格 -->
      <div class="cat-strategy-grid">
        <article
          v-for="s in filteredStrategies"
          :key="s.seed"
          class="strategy-card card"
          @click="goDetail(s.seed)"
        >
          <div class="card-top">
            <div class="card-top-left">
              <span class="card-cat">{{ s.navCategory }}</span>
              <div class="card-stars">
                <span v-for="n in 5" :key="n" :class="n <= (s.outlookStars || 3) ? 'filled' : ''">★</span>
              </div>
            </div>
            <!-- 风险等级标签 -->
            <div class="risk-badge" :class="'risk-' + ((s as any).riskLevel || 'R3')">
              {{ ((s as any).riskLevel || 'R3') }}
            </div>
          </div>

          <h3 class="card-name">
            {{ s.name }}
            <!-- AI优选 移到策略名右侧作为显著标识 -->
            <span class="card-ai-chip" v-if="s.annualReturn != null && s.annualReturn >= 15 && s.winRate != null && s.winRate >= 80">
              ⭐ AI优选
            </span>
          </h3>
          <div class="card-owner">{{ s.owner }}</div>

          <!-- 指标墙 -->
          <div class="card-metrics">
            <div class="cm-item">
              <div class="cm-val" :class="s.annualReturn != null ? (s.annualReturn >= 0 ? 'gain' : 'loss') : 'neutral'">
                {{ s.annualReturn != null ? ((s.annualReturn >= 0 ? '+' : '') + s.annualReturn.toFixed(2) + '%') : '—' }}
              </div>
              <div class="cm-label">年化收益</div>
            </div>
            <div class="cm-divider"></div>
            <div class="cm-item">
              <div class="cm-val" :class="winRateClass(s.winRate)">{{ s.winRate != null ? s.winRate.toFixed(0) + '%' : '—' }}</div>
              <div class="cm-label">胜率</div>
            </div>
            <div class="cm-divider"></div>
            <div class="cm-item">
              <div class="cm-val neutral">{{ s.benchmarkName || '—' }}</div>
              <div class="cm-label">基准</div>
            </div>
          </div>

          <!-- 标签 -->
          <div class="card-tags">
            <span v-for="tag in (s.tags || []).slice(0, 3)" :key="tag" class="card-tag">{{ tag }}</span>
          </div>

          <div class="card-footer">
            <span class="card-action">查看详情 →</span>
          </div>
        </article>
      </div>

      <!-- 搜索空状态 -->
      <div v-if="!loading && !error && filteredStrategies.length === 0" class="empty-search card">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">没有找到匹配的策略</div>
        <button class="retry-btn" @click="resetFilters">重置筛选</button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listStrategies, type StrategyItem } from '../services/strategy'

const router = useRouter()
const allStrategies = ref<StrategyItem[]>([])
const loading = ref(false)
const error = ref('')
const searchText = ref('')
const activeCat = ref('')
const activeRisk = ref('')
const sortKey = ref('annualReturn')

const sortOptions = [
  { key: 'annualReturn', label: '年化收益' },
  { key: 'winRate', label: '胜率' },
  { key: 'name', label: '名称' },
]

const riskFilters = [
  { value: 'R3', label: 'R3' },
  { value: 'R4', label: 'R4' },
  { value: 'R5', label: 'R5' },
]

const avgReturn = computed(() => {
  if (!allStrategies.value.length) return '—'
  const valid = allStrategies.value.filter(s => s.annualReturn != null)
  return valid.length ? (valid.reduce((a, b) => a + b.annualReturn, 0) / valid.length).toFixed(1) + '%' : '—'
})
const avgWinRate = computed(() => {
  if (!allStrategies.value.length) return '—'
  const valid = allStrategies.value.filter(s => s.winRate != null)
  return valid.length ? (valid.reduce((a, b) => a + b.winRate, 0) / valid.length).toFixed(0) + '%' : '—'
})
const categoryCount = computed(() => {
  return new Set(allStrategies.value.map(s => s.navCategory)).size
})

const categoriesWithStrategies = computed(() => {
  const map: Record<string, StrategyItem[]> = {}
  for (const s of allStrategies.value) {
    const cat = s.navCategory || '其他'
    if (!map[cat]) map[cat] = []
    map[cat].push(s)
  }
  return Object.entries(map)
    .map(([name, strategies]) => {
      const valid = strategies.filter(s => s.annualReturn > 0)
      const riskCounts: Record<string, number> = {}
      for (const s of strategies) {
        const r = ((s as any).riskLevel as string) || 'R3'
        riskCounts[r] = (riskCounts[r] || 0) + 1
      }
      const topRisk = Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'R3'
      return {
        name,
        count: strategies.length,
        avgReturn: valid.length ? (valid.reduce((a, b) => a + b.annualReturn, 0) / valid.length).toFixed(1) + '%' : '—',
        avgWinRate: valid.length ? (valid.reduce((a, b) => a + b.winRate, 0) / valid.length).toFixed(0) + '%' : '—',
        strategies: [...strategies].sort((a, b) => (b.annualReturn ?? -Infinity) - (a.annualReturn ?? -Infinity)),
        topRisk,
      }
    })
    .sort((a, b) => b.count - a.count)
})

const filteredStrategies = computed(() => {
  let list = [...allStrategies.value]
  if (activeCat.value) list = list.filter(s => s.navCategory === activeCat.value)
  if (activeRisk.value) list = list.filter(s => (s as any).riskLevel === activeRisk.value)
  const q = searchText.value.trim().toLowerCase()
  if (q) list = list.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.owner.toLowerCase().includes(q) ||
    (s.tags || []).some(t => t.toLowerCase().includes(q))
  )
  list.sort((a, b) => {
    if (sortKey.value === 'annualReturn') return (b.annualReturn ?? -Infinity) - (a.annualReturn ?? -Infinity)
    if (sortKey.value === 'winRate') return (b.winRate ?? -Infinity) - (a.winRate ?? -Infinity)
    if (sortKey.value === 'name') return a.name.localeCompare(b.name)
    return 0
  })
  return list
})

function toggleCategory(cat: string) {
  if (activeCat.value === cat) {
    activeCat.value = ''
  } else {
    activeCat.value = cat
    searchText.value = ''
  }
}

function resetFilters() {
  searchText.value = ''
  activeCat.value = ''
  activeRisk.value = ''
}

function winRateClass(w: number | null) {
  if (w == null) return 'neutral'
  if (w >= 80) return 'gain'; if (w >= 60) return 'mid'; return 'loss'
}

async function loadStrategies() {
  loading.value = true
  error.value = ''
  try {
    allStrategies.value = await listStrategies()
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function goDetail(seed: number) {
  router.push(`/product/${seed}`)
}

function goExhibition() {
  router.push('/exhibition')
}

function goAdvisor() {
  router.push('/advisor')
}

onMounted(loadStrategies)
</script>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: 0; min-height: calc(100vh - 88px); box-sizing: border-box; }

/* 顶部 */
.home-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 20px 16px 16px; gap: 24px; flex-wrap: wrap; border-bottom: 1px solid rgba(23,55,91,0.08); }
.header-left .eyebrow { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
.header-left h1 { margin: 0; font-size: 34px; font-weight: 700; color: var(--text); }
.header-left .page-lead { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
.header-right { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
.h-stat { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.h-val { font-size: 28px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: var(--blue); }
.h-val.gain { color: #c24a00; }
.h-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
.h-actions { display: flex; gap: 10px; align-items: center; }

/* AI顾问CTA */
.advisor-cta {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 20px; border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #9e722e, #c24a00);
  color: #fff; cursor: pointer; font-size: 14px; font-weight: 700;
  box-shadow: 0 6px 20px rgba(158,114,46,0.3);
  transition: all 0.2s;
}
.advisor-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(158,114,46,0.4); }

/* 分类概览（简化标签版） */
.cat-overview { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 0 12px; }
.cat-ov-tag {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 999px;
  border: 1.5px solid rgba(23,55,91,0.15);
  background: rgba(255,255,255,0.7);
  cursor: pointer; font-size: 13px;
  transition: all 0.2s ease;
}
.cat-ov-tag:hover { border-color: var(--gold); color: var(--gold); background: rgba(158,114,46,0.06); }
.cat-ov-tag.active { border-color: var(--gold); background: rgba(158,114,46,0.1); color: var(--gold); font-weight: 700; }
.cot-name { font-weight: 600; color: var(--text); }
.cot-count { font-size: 11px; color: var(--muted); padding: 1px 7px; border-radius: 999px; background: rgba(23,55,91,0.07); }

/* 风险等级说明 */
.risk-legend { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 0 4px 12px; }
.risk-legend-title { font-size: 12px; color: var(--muted); margin-right: 4px; }
.risk-desc { font-size: 12px; color: var(--muted); }

/* 搜索+排序+筛选 */
.controls-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 0 0; gap: 12px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; max-width: 400px; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--muted); }
.search-input { width: 100%; padding: 9px 40px 9px 40px; border-radius: 10px; border: 1px solid rgba(23,55,91,0.15); background: rgba(255,255,255,0.8); color: var(--text); font-size: 13px; outline: none; box-sizing: border-box; }
.search-input:focus { border-color: var(--blue); }
.search-input::placeholder { color: var(--muted); }
.search-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; padding: 4px; }
.sort-tabs { display: flex; align-items: center; gap: 4px; }
.sort-label { font-size: 12px; color: var(--muted); margin-right: 4px; }
.sort-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.sort-btn:hover { color: var(--text); }
.sort-btn.active { background: rgba(23,55,91,0.08); border-color: rgba(23,55,91,0.18); color: var(--blue); }
.risk-filter { display: flex; align-items: center; gap: 4px; }
.risk-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(23,55,91,0.12); background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.risk-btn:hover { border-color: rgba(23,55,91,0.3); color: var(--text); }
.risk-btn.active { background: rgba(23,55,91,0.08); border-color: rgba(23,55,91,0.2); color: var(--blue); font-weight: 600; }

/* 结果栏 */
.result-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 4px 4px; }
.result-count { font-size: 13px; color: var(--muted); }
.reset-btn { background: none; border: none; color: var(--gold); cursor: pointer; font-size: 13px; padding: 4px 8px; border-radius: 6px; }
.reset-btn:hover { background: rgba(158,114,46,0.1); }

/* 卡片 */
.card { background: rgba(255,255,255,0.84); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 4px 20px rgba(41,61,84,0.08); border-radius: 20px; }

/* 大类分组 */
.cat-group { margin-top: 24px; }
.cat-group:first-child { margin-top: 0; }
.cat-group-header { display: flex; justify-content: space-between; align-items: center; padding: 0 4px 14px; }
.cat-group-title { display: flex; align-items: baseline; gap: 12px; }
.cat-group-title h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
.cat-group-count { font-size: 13px; color: var(--muted); }
.cat-group-avg { font-size: 13px; color: var(--muted); }
.cat-group-avg strong { font-weight: 700; margin-left: 4px; }

/* 策略网格 */
.cat-strategy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

/* 策略卡片 */
.strategy-card { padding: 18px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: all 0.25s ease; position: relative; }
.strategy-card:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(41,61,84,0.14); }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; }
.card-top-left { display: flex; align-items: center; gap: 8px; }
.card-cat { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); white-space: nowrap; }
.card-stars { display: flex; gap: 0px; }
.card-stars span { font-size: 11px; color: rgba(23,55,91,0.18); }
.card-stars span.filled { color: var(--gold); }

/* 风险等级徽章 */
.risk-badge { font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 5px; flex-shrink: 0; letter-spacing: 0.04em; }
.risk-badge.risk-R1 { background: rgba(88,199,255,0.15); color: #58c7ff; border: 1px solid rgba(88,199,255,0.3); }
.risk-badge.risk-R2 { background: rgba(74,222,128,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
.risk-badge.risk-R3 { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.risk-badge.risk-R4 { background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.3); }
.risk-badge.risk-R5 { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

/* AI推荐徽章 */
.card-ai-chip {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 6px;
  background: linear-gradient(135deg, rgba(158,114,46,0.15), rgba(194,74,0,0.1));
  border: 1.5px solid rgba(158,114,46,0.4);
  color: var(--gold);
  margin-left: 10px;
  vertical-align: middle;
  flex-shrink: 0;
}
.card-name {
  margin: 0; font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.3;
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
}
.card-owner { font-size: 12px; color: var(--muted); }

/* 指标墙 */
.card-metrics { display: flex; align-items: center; background: rgba(23,55,91,0.04); border-radius: 10px; overflow: hidden; }
.cm-item { flex: 1; text-align: center; padding: 9px 6px; }
.cm-val { font-size: 15px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.cm-val.gain { color: #c24a00; }
.cm-val.loss { color: #b82020; }
.cm-val.mid { color: #9e722e; }
.cm-val.neutral { font-size: 11px; color: var(--muted); font-family: inherit; }
.cm-label { font-size: 10px; color: var(--muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
.cm-divider { width: 1px; height: 32px; background: rgba(23,55,91,0.08); flex-shrink: 0; }

/* 标签 */
.card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.card-tag { font-size: 11px; padding: 3px 9px; border-radius: 5px; background: rgba(23,55,91,0.06); border: 1px solid rgba(23,55,91,0.1); color: rgba(23,55,91,0.7); }

/* 底部 */
.card-footer { margin-top: 4px; padding-top: 10px; border-top: 1px solid rgba(23,55,91,0.07); }
.card-action { font-size: 13px; color: var(--gold); font-weight: 600; }

/* 加载骨架 */
.loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 16px 16px; }
.skeleton-card { height: 220px; border-radius: 20px; background: rgba(23,55,91,0.06); animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }

/* 空/错误 */
.error-card { margin: 40px 32px; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.error-icon { font-size: 40px; }
.error-msg { font-size: 16px; color: var(--text); font-weight: 600; }
.empty-search { margin: 40px 32px; padding: 60px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-icon { font-size: 40px; }
.empty-title { font-size: 18px; font-weight: 600; color: var(--text); }
.retry-btn { margin-top: 8px; padding: 10px 24px; border-radius: 10px; border: 1px solid rgba(23,55,91,0.2); background: transparent; color: var(--blue); cursor: pointer; font-size: 14px; }
.retry-btn:hover { background: rgba(23,55,91,0.06); }

/* 展览按钮 */
.exhibition-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 12px;
  border: 1.5px solid var(--blue);
  background: transparent; color: var(--blue);
  cursor: pointer; font-size: 13px; font-weight: 600;
  transition: all 0.2s;
}
.exhibition-btn:hover { background: var(--blue); color: #fff; }

/* 颜色 */
.gain { color: #c24a00 !important; }
.loss { color: #b82020 !important; }
.mid { color: #9e722e !important; }
.neutral { color: var(--muted) !important; }

@media (max-width: 768px) {
  .home-header { padding: 24px 16px 18px; }
  .controls-bar { padding: 16px 16px 0; }
  .search-wrap { max-width: 100%; width: 100%; }
  .cat-strategy-grid { grid-template-columns: 1fr 1fr; }
  .loading-grid { padding: 16px; }
}
@media (max-width: 480px) {
  .cat-strategy-grid { grid-template-columns: 1fr; }
  .controls-bar { flex-direction: column; align-items: stretch; }
  .sort-tabs { overflow-x: auto; }
}



/* 策略体系总览 */
.strategy-overview {
  margin-bottom: 20px;
}
.so-inner {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  padding: 24px 28px;
  background: rgba(255,252,246,0.9);
  border: 1px solid rgba(255,255,255,0.9);
  box-shadow: 0 4px 20px rgba(41,61,84,0.08);
  border-radius: 20px;
}
.so-left { flex: 1; }
.so-eyebrow {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 8px;
}
.so-heading { font-size: 22px; font-weight: 700; color: var(--text); margin: 0 0 10px; }
.so-desc { font-size: 13.5px; color: var(--muted); line-height: 1.8; margin: 0; }
.so-right { flex-shrink: 0; }
.so-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.sos-item {
  text-align: center;
  padding: 12px 20px;
  background: rgba(23,55,91,0.04);
  border-radius: 14px;
  min-width: 90px;
}
.sos-num {
  font-size: 22px;
  font-weight: 800;
  font-family: 'DIN Alternate','Bahnschrift',sans-serif;
  color: var(--text);
  line-height: 1;
}
.sos-label { font-size: 11px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }

</style>
