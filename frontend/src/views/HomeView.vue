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
      <div class="header-stats">
        <div class="h-stat">
          <span class="h-val gain">{{ avgReturn }}</span>
          <span class="h-label">平均年化</span>
        </div>
        <div class="h-stat">
          <span class="h-val">{{ avgWinRate }}</span>
          <span class="h-label">平均胜率</span>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 分类标签导航 -->
    <!-- ═══════════════════════════════════════════════ -->
    <nav class="category-nav">
      <div class="cat-nav-inner">
        <button
          v-for="cat in categorySummary"
          :key="cat.name"
          class="cat-tab"
          :class="{ active: activeCat === cat.name }"
          @click="selectCategory(cat.name)"
        >
          <span class="cat-tab-name">{{ cat.name }}</span>
          <span class="cat-tab-count">{{ cat.count }}</span>
        </button>
      </div>
    </nav>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 搜索 + 排序 -->
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

      <!-- "全部" 分类时：按大类分组展示 -->
      <template v-if="activeCat === '' && !searchText">
        <div v-for="cat in categoriesWithStrategies" :key="cat.name" class="cat-group">
          <div class="cat-group-header">
            <div class="cat-group-title">
              <h2>{{ cat.name }}</h2>
              <span class="cat-group-count">{{ cat.strategies.length }} 条策略</span>
            </div>
            <div class="cat-group-avg">
              区间均值
              <strong class="gain">{{ cat.avgReturn }}</strong>
            </div>
          </div>
          <div class="cat-strategy-grid">
            <article
              v-for="s in cat.strategies"
              :key="s.seed"
              class="strategy-card card"
              @click="goDetail(s.seed)"
            >
              <div class="card-top">
                <span class="card-cat">{{ s.navCategory }}</span>
                <div class="card-stars">
                  <span v-for="n in 5" :key="n" :class="n <= (s.outlookStars || 3) ? 'filled' : ''">★</span>
                </div>
              </div>
              <h3 class="card-name">{{ s.name }}</h3>
              <div class="card-owner">{{ s.owner }}</div>
              <div class="card-metrics">
                <div class="cm-item">
                  <div class="cm-val" :class="s.annualReturn >= 0 ? 'gain' : 'loss'">
                    {{ s.annualReturn >= 0 ? '+' : '' }}{{ s.annualReturn.toFixed(2) }}%
                  </div>
                  <div class="cm-label">年化收益</div>
                </div>
                <div class="cm-divider"></div>
                <div class="cm-item">
                  <div class="cm-val" :class="winRateClass(s.winRate)">{{ s.winRate.toFixed(0) }}%</div>
                  <div class="cm-label">胜率</div>
                </div>
                <div class="cm-divider"></div>
                <div class="cm-item">
                  <div class="cm-val neutral">{{ s.benchmarkName || '—' }}</div>
                  <div class="cm-label">基准</div>
                </div>
              </div>
              <div class="card-tags">
                <span v-for="tag in (s.tags || []).slice(0, 3)" :key="tag" class="card-tag">{{ tag }}</span>
              </div>
              <div class="card-footer">
                <span class="card-action">查看详情 →</span>
              </div>
            </article>
          </div>
        </div>
      </template>

      <!-- 选中具体分类时：直接展示该分类策略 -->
      <template v-else>
        <div class="cat-group-header" style="margin-bottom: 16px;">
          <div class="cat-group-title">
            <h2>{{ activeCat }}</h2>
            <span class="cat-group-count">{{ filteredStrategies.length }} 条策略</span>
          </div>
        </div>
        <div class="cat-strategy-grid">
          <article
            v-for="s in filteredStrategies"
            :key="s.seed"
            class="strategy-card card"
            @click="goDetail(s.seed)"
          >
            <div class="card-top">
              <span class="card-cat">{{ s.navCategory }}</span>
              <div class="card-stars">
                <span v-for="n in 5" :key="n" :class="n <= (s.outlookStars || 3) ? 'filled' : ''">★</span>
              </div>
            </div>
            <h3 class="card-name">{{ s.name }}</h3>
            <div class="card-owner">{{ s.owner }}</div>
            <div class="card-metrics">
              <div class="cm-item">
                <div class="cm-val" :class="s.annualReturn >= 0 ? 'gain' : 'loss'">
                  {{ s.annualReturn >= 0 ? '+' : '' }}{{ s.annualReturn.toFixed(2) }}%
                </div>
                <div class="cm-label">年化收益</div>
              </div>
              <div class="cm-divider"></div>
              <div class="cm-item">
                <div class="cm-val" :class="winRateClass(s.winRate)">{{ s.winRate.toFixed(0) }}%</div>
                <div class="cm-label">胜率</div>
              </div>
              <div class="cm-divider"></div>
              <div class="cm-item">
                <div class="cm-val neutral">{{ s.benchmarkName || '—' }}</div>
                <div class="cm-label">基准</div>
              </div>
            </div>
            <div class="card-tags">
              <span v-for="tag in (s.tags || []).slice(0, 3)" :key="tag" class="card-tag">{{ tag }}</span>
            </div>
            <div class="card-footer">
              <span class="card-action">查看详情 →</span>
            </div>
          </article>
        </div>
      </template>

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
const sortKey = ref('annualReturn')

const sortOptions = [
  { key: 'annualReturn', label: '年化收益' },
  { key: 'winRate', label: '胜率' },
  { key: 'name', label: '名称' },
]

const avgReturn = computed(() => {
  if (!allStrategies.value.length) return '—'
  return (allStrategies.value.reduce((a, b) => a + b.annualReturn, 0) / allStrategies.value.length).toFixed(1) + '%'
})
const avgWinRate = computed(() => {
  if (!allStrategies.value.length) return '—'
  return (allStrategies.value.reduce((a, b) => a + b.winRate, 0) / allStrategies.value.length).toFixed(0) + '%'
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
    .map(([name, strategies]) => ({
      name,
      count: strategies.length,
      avgReturn: (strategies.reduce((a, b) => a + b.annualReturn, 0) / strategies.length).toFixed(1) + '%',
      strategies: [...strategies].sort((a, b) => b.annualReturn - a.annualReturn),
    }))
    .sort((a, b) => b.count - a.count)
})

const categorySummary = computed(() => [
  { name: '', label: '全部', count: allStrategies.value.length },
  ...categoriesWithStrategies.value.map(c => ({ name: c.name, label: c.name, count: c.count })),
])

const filteredStrategies = computed(() => {
  let list = [...allStrategies.value]
  if (activeCat.value) list = list.filter(s => s.navCategory === activeCat.value)
  const q = searchText.value.trim().toLowerCase()
  if (q) list = list.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.owner.toLowerCase().includes(q) ||
    (s.tags || []).some(t => t.toLowerCase().includes(q))
  )
  list.sort((a, b) => {
    if (sortKey.value === 'annualReturn') return b.annualReturn - a.annualReturn
    if (sortKey.value === 'winRate') return b.winRate - a.winRate
    if (sortKey.value === 'name') return a.name.localeCompare(b.name)
    return 0
  })
  return list
})

function selectCategory(cat: string) {
  activeCat.value = cat
  searchText.value = ''
}

function resetFilters() {
  searchText.value = ''
  activeCat.value = ''
}

function winRateClass(w: number) {
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

onMounted(loadStrategies)
</script>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: 0; padding-bottom: 60px; }

/* 顶部 */
.home-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 36px 32px 24px; gap: 24px; flex-wrap: wrap; border-bottom: 1px solid rgba(23,55,91,0.08); }
.header-left .eyebrow { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
.header-left h1 { margin: 0; font-size: 34px; font-weight: 700; color: var(--text); }
.header-left .page-lead { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
.header-stats { display: flex; gap: 28px; }
.h-stat { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.h-val { font-size: 28px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: var(--blue); }
.h-val.gain { color: #c24a00; }
.h-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }

/* 分类导航 */
.category-nav { position: sticky; top: 0; z-index: 10; background: rgba(248,242,233,0.92); backdrop-filter: blur(16px); padding: 0 32px; border-bottom: 1px solid rgba(23,55,91,0.08); }
.cat-nav-inner { display: flex; gap: 4px; overflow-x: auto; padding: 12px 0; scrollbar-width: none; }
.cat-nav-inner::-webkit-scrollbar { display: none; }
.cat-tab { display: flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(23,55,91,0.12); background: transparent; color: var(--muted); cursor: pointer; font-size: 13px; white-space: nowrap; transition: all 0.2s; }
.cat-tab:hover { border-color: rgba(23,55,91,0.35); color: var(--text); }
.cat-tab.active { background: var(--blue); border-color: var(--blue); color: #fff; }
.cat-tab-count { font-size: 11px; padding: 2px 7px; border-radius: 999px; background: rgba(23,55,91,0.08); }
.cat-tab.active .cat-tab-count { background: rgba(255,255,255,0.25); }

/* 搜索+排序 */
.controls-bar { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px 0; gap: 16px; flex-wrap: wrap; }
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

/* 卡片 */
.card { background: rgba(255,255,255,0.84); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 4px 20px rgba(41,61,84,0.08); border-radius: 20px; }

/* 大类分组 */
.cat-group { margin-top: 28px; }
.cat-group:first-child { margin-top: 24px; }
.cat-group-header { display: flex; justify-content: space-between; align-items: center; padding: 0 4px 14px; }
.cat-group-title { display: flex; align-items: baseline; gap: 12px; }
.cat-group-title h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
.cat-group-count { font-size: 13px; color: var(--muted); }
.cat-group-avg { font-size: 13px; color: var(--muted); }
.cat-group-avg strong { font-weight: 700; margin-left: 4px; }

/* 策略网格 */
.cat-strategy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

/* 策略卡片 */
.strategy-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: all 0.25s ease; }
.strategy-card:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(41,61,84,0.14); }
.card-top { display: flex; justify-content: space-between; align-items: center; }
.card-cat { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); }
.card-stars { display: flex; gap: 1px; }
.card-stars span { font-size: 12px; color: rgba(23,55,91,0.15); }
.card-stars span.filled { color: var(--gold); }
.card-name { margin: 0; font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.3; }
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
.loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 24px 32px; }
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
}
</style>
