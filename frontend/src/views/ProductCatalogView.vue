<template>
  <div class="catalog-page">

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 顶部：标题 + 全局统计条 -->
    <!-- ═══════════════════════════════════════════════ -->
    <header class="catalog-header">
      <div class="catalog-header-inner">
        <div class="catalog-title-block">
          <div class="eyebrow">光大资管 · 策略研究平台</div>
          <h1>策略目录</h1>
          <p class="page-lead">{{ allStrategies.length }} 条策略 · 覆盖 7 大资产类别</p>
        </div>
        <div class="header-stats">
          <div class="h-stat">
            <span class="h-stat-val">{{ allStrategies.length }}</span>
            <span class="h-stat-label">策略总数</span>
          </div>
          <div class="h-stat">
            <span class="h-stat-val positive">{{ avgReturn }}</span>
            <span class="h-stat-label">平均年化收益</span>
          </div>
          <div class="h-stat">
            <span class="h-stat-val cyan">{{ avgWinRate }}</span>
            <span class="h-stat-label">平均胜率</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 分类导航条 -->
    <!-- ═══════════════════════════════════════════════ -->
    <nav class="category-nav">
      <div class="category-nav-inner">
        <button
          v-for="cat in categorySummary"
          :key="cat.name"
          class="cat-btn"
          :class="{ active: activeCategory === cat.name }"
          @click="selectCategory(cat.name)"
        >
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ cat.count }}</span>
          <span class="cat-avg">{{ cat.avgReturn }}</span>
        </button>
      </div>
    </nav>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 搜索 + 排序 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div class="catalog-controls">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="searchText" class="search-input" placeholder="搜索策略名称、负责人、标签..." />
        <button v-if="searchText" class="search-clear" @click="searchText = ''">✕</button>
      </div>
      <div class="sort-tabs">
        <span class="sort-label">排序：</span>
        <button v-for="s in sortOptions" :key="s.key"
          class="sort-btn" :class="{ active: sortKey === s.key }"
          @click="setSort(s.key)">{{ s.label }}</button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 加载 / 错误 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-card glass-card">
        <div class="error-icon">⚠️</div>
        <div class="error-msg">{{ error }}</div>
        <div class="error-hint">请确保 Java 服务已启动于 localhost:3003</div>
        <button class="retry-btn" @click="loadStrategies">重新加载</button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- 策略卡片列表 -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-else-if="displayedStrategies.length > 0" class="strategy-list">

      <!-- 当前分类标题 -->
      <div class="list-header" v-if="activeCategory !== '全部'">
        <div class="list-cat-badge">
          <span>{{ activeCategory }}</span>
          <span class="list-cat-count">{{ filteredStrategies.length }} 条策略</span>
        </div>
        <div class="list-cat-avg">
          区间平均收益 <strong class="positive">{{ currentCatAvg }}</strong>
        </div>
      </div>

      <div class="cards-grid">
        <article
          v-for="strategy in displayedStrategies"
          :key="strategy.seed"
          class="strategy-card glass-card"
          @click="goDetail(strategy.seed)"
        >
          <!-- 卡片顶部：分类 + ID -->
          <div class="card-top">
            <span class="card-cat">{{ strategy.navCategory }}</span>
            <div class="card-stars">
              <span v-for="n in 5" :key="n" class="s" :class="{ filled: n <= (strategy.outlookStars || 3) }">★</span>
            </div>
          </div>

          <!-- 策略名 -->
          <h2 class="card-name">{{ strategy.name }}</h2>
          <div class="card-owner">{{ strategy.owner }}</div>

          <!-- 核心数字墙 -->
          <div class="card-metrics">
            <div class="cm-item">
              <div class="cm-val" :class="strategy.annualReturn >= 0 ? 'positive' : 'negative'">
                {{ strategy.annualReturn >= 0 ? '+' : '' }}{{ strategy.annualReturn.toFixed(2) }}%
              </div>
              <div class="cm-label">年化收益</div>
            </div>
            <div class="cm-divider"></div>
            <div class="cm-item">
              <div class="cm-val" :class="winRateClass(strategy.winRate)">{{ strategy.winRate.toFixed(0) }}%</div>
              <div class="cm-label">年度胜率</div>
            </div>
            <div class="cm-divider"></div>
            <div class="cm-item">
              <div class="cm-val neutral">{{ strategy.benchmarkName || '—' }}</div>
              <div class="cm-label">比较基准</div>
            </div>
          </div>

          <!-- 标签 -->
          <div class="card-tags">
            <span v-for="tag in (strategy.tags || []).slice(0, 3)" :key="tag" class="card-tag">{{ tag }}</span>
          </div>

          <!-- 底部操作 -->
          <div class="card-footer">
            <span class="card-action">查看详情</span>
            <svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </article>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
        <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">没有找到匹配的策略</div>
      <div class="empty-sub">试试调整搜索词或切换分类</div>
      <button class="retry-btn" @click="resetFilters">重置筛选</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { listStrategies, type StrategyItem } from '../services/strategy'

const router = useRouter()
const allStrategies = ref<StrategyItem[]>([])
const loading = ref(false)
const error = ref('')
const searchText = ref('')
const activeCategory = ref('全部')
const sortKey = ref('annualReturn')
const currentPage = ref(1)
const pageSize = 12

const sortOptions = [
  { key: 'annualReturn', label: '年化收益' },
  { key: 'winRate', label: '胜率' },
  { key: 'name', label: '名称' },
  { key: 'seed', label: '默认' },
]

// 分类汇总
const categorySummary = computed(() => {
  const cats: Record<string, StrategyItem[]> = {}
  for (const s of allStrategies.value) {
    const cat = s.navCategory || '其他'
    if (!cats[cat]) cats[cat] = []
    cats[cat].push(s)
  }
  return [
    { name: '全部', count: allStrategies.value.length, avgReturn: avgReturn.value },
    ...Object.entries(cats).map(([name, items]) => ({
      name,
      count: items.length,
      avgReturn: ((items.reduce((a, b) => a + b.annualReturn, 0) / items.length)).toFixed(1) + '%',
    })),
  ]
})

const avgReturn = computed(() => {
  if (!allStrategies.value.length) return '—'
  const avg = allStrategies.value.reduce((a, b) => a + b.annualReturn, 0) / allStrategies.value.length
  return avg.toFixed(1) + '%'
})

const avgWinRate = computed(() => {
  if (!allStrategies.value.length) return '—'
  const avg = allStrategies.value.reduce((a, b) => a + b.winRate, 0) / allStrategies.value.length
  return avg.toFixed(0) + '%'
})

const filteredStrategies = computed(() => {
  let list = [...allStrategies.value]
  if (activeCategory.value !== '全部') {
    list = list.filter(s => s.navCategory === activeCategory.value)
  }
  const q = searchText.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      (s.tags || []).some(t => t.toLowerCase().includes(q)) ||
      s.navCategory.toLowerCase().includes(q)
    )
  }
  list.sort((a, b) => {
    if (sortKey.value === 'annualReturn') return b.annualReturn - a.annualReturn
    if (sortKey.value === 'winRate') return b.winRate - a.winRate
    if (sortKey.value === 'name') return a.name.localeCompare(b.name)
    return a.seed - b.seed
  })
  return list
})

const currentCatAvg = computed(() => {
  const list = activeCategory.value === '全部' ? allStrategies.value
    : allStrategies.value.filter(s => s.navCategory === activeCategory.value)
  if (!list.length) return '—'
  return (list.reduce((a, b) => a + b.annualReturn, 0) / list.length).toFixed(1) + '%'
})

const totalPages = computed(() => Math.ceil(filteredStrategies.value.length / pageSize))
const displayedStrategies = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStrategies.value.slice(start, start + pageSize)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: number[] = []
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i)
  return pages
})

function selectCategory(cat: string) {
  activeCategory.value = cat
  currentPage.value = 1
}

function setSort(key: string) {
  sortKey.value = key
  currentPage.value = 1
}

function resetFilters() {
  searchText.value = ''
  activeCategory.value = '全部'
  currentPage.value = 1
}

function winRateClass(w: number) {
  if (w >= 80) return 'positive'; if (w >= 60) return 'mid'; return 'negative'
}

async function loadStrategies() {
  loading.value = true
  error.value = ''
  try {
    const result = await listStrategies()
    console.log('[Catalog] listStrategies returned:', result.length, 'strategies')
    allStrategies.value = result
  } catch (e: any) {
    console.error('[Catalog] loadStrategies error:', e)
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function goDetail(seed: number) {
  router.push(`/product/${seed}`)
}

watch([searchText, activeCategory], () => { currentPage.value = 1 })

onMounted(loadStrategies)
</script>

<style scoped>
.catalog-page { max-width: 1400px; margin: 0 auto; padding: 0 0 32px; }

/* ── 顶部标题区 ── */
.catalog-header { padding: 20px 16px 16px; border-bottom: 1px solid rgba(158,216,255,0.1); }
.catalog-header-inner { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
.eyebrow { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cyan); margin-bottom: 8px; }
.catalog-title-block h1 { margin: 0; font-size: 36px; font-weight: 700; color: #fff; }
.page-lead { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
.header-stats { display: flex; gap: 32px; }
.h-stat { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.h-stat-val { font-size: 26px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; color: #fff; }
.h-stat-val.positive { color: #57c7ff; }
.h-stat-val.cyan { color: #ffbd63; }
.h-stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }

/* ── 分类导航 ── */
.category-nav { position: sticky; top: 0; z-index: 10; background: rgba(6,14,28,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(158,216,255,0.1); padding: 0 16px; }
.category-nav-inner { display: flex; gap: 4px; overflow-x: auto; padding: 12px 0; scrollbar-width: none; }
.category-nav-inner::-webkit-scrollbar { display: none; }
.cat-btn { display: flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(158,216,255,0.14); background: transparent; color: var(--muted); cursor: pointer; font-size: 13px; white-space: nowrap; transition: all 0.2s; }
.cat-btn:hover { border-color: rgba(158,216,255,0.35); color: #fff; }
.cat-btn.active { background: rgba(86,199,255,0.18); border-color: rgba(86,199,255,0.5); color: var(--cyan); }
.cat-name { font-weight: 500; }
.cat-count { font-size: 11px; padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,0.08); }
.cat-btn.active .cat-count { background: rgba(86,199,255,0.2); }
.cat-avg { font-size: 11px; opacity: 0.7; }

/* ── 搜索 + 排序 ── */
.catalog-controls { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px; gap: 16px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; max-width: 420px; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--muted); }
.search-input { width: 100%; padding: 10px 40px 10px 42px; border-radius: 10px; border: 1px solid rgba(158,216,255,0.18); background: rgba(255,255,255,0.06); color: #fff; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 0.2s; }
.search-input:focus { border-color: rgba(86,199,255,0.45); }
.search-input::placeholder { color: var(--muted); }
.search-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 4px; }
.sort-tabs { display: flex; align-items: center; gap: 4px; }
.sort-label { font-size: 12px; color: var(--muted); margin-right: 4px; }
.sort-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.sort-btn:hover { color: #fff; }
.sort-btn.active { background: rgba(86,199,255,0.14); border-color: rgba(86,199,255,0.3); color: var(--cyan); }

/* ── 列表头部 ── */
.list-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px; margin-top: 8px; }
.list-cat-badge { display: flex; align-items: center; gap: 12px; }
.list-cat-badge > span:first-child { font-size: 18px; font-weight: 600; color: #fff; }
.list-cat-count { font-size: 12px; color: var(--muted); }
.list-cat-avg { font-size: 13px; color: var(--muted); }
.list-cat-avg strong { font-weight: 600; }
.list-cat-avg strong.positive { color: #57c7ff; }

/* ── 策略卡片网格 ── */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; padding: 0 16px; }
.strategy-card { padding: 22px; display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: all 0.25s ease; }
.strategy-card:hover { border-color: rgba(86,199,255,0.35); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }

.card-top { display: flex; justify-content: space-between; align-items: center; }
.card-cat { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--cyan); background: rgba(86,199,255,0.1); padding: 3px 10px; border-radius: 999px; }
.card-stars { display: flex; gap: 1px; }
.s { font-size: 12px; color: rgba(255,189,99,0.2); }
.s.filled { color: #ffbd63; }

.card-name { margin: 0; font-size: 18px; font-weight: 700; color: #fff; line-height: 1.3; }
.card-owner { font-size: 12px; color: var(--muted); }

/* 核心数字墙 */
.card-metrics { display: flex; align-items: center; gap: 0; background: rgba(255,255,255,0.04); border-radius: 10px; overflow: hidden; }
.cm-item { flex: 1; text-align: center; padding: 10px 8px; }
.cm-val { font-size: 16px; font-weight: 700; font-family: 'DIN Alternate','Bahnschrift',sans-serif; }
.cm-val.positive { color: #57c7ff; }
.cm-val.negative { color: #ff6b7f; }
.cm-val.neutral { font-size: 11px; color: rgba(200,219,255,0.6); font-family: inherit; }
.cm-val.mid { color: #ffbd63; }
.cm-label { font-size: 10px; color: var(--muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.06em; }
.cm-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.08); flex-shrink: 0; }

.card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.card-tag { font-size: 11px; padding: 3px 9px; border-radius: 4px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: rgba(200,219,255,0.65); }

.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.07); }
.card-action { font-size: 13px; color: var(--cyan); font-weight: 500; }
.card-arrow { width: 16px; height: 16px; color: var(--cyan); }

/* 分页 */
.pagination { display: flex; justify-content: center; gap: 4px; padding: 20px 16px 0; }
.page-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid rgba(158,216,255,0.14); background: transparent; color: var(--muted); cursor: pointer; font-size: 14px; transition: all 0.2s; }
.page-btn:hover:not(:disabled) { border-color: rgba(158,216,255,0.35); color: #fff; }
.page-btn.active { background: rgba(86,199,255,0.18); border-color: rgba(86,199,255,0.5); color: var(--cyan); }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* 加载骨架 */
.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; padding: 20px 16px; }
.skeleton-card { height: 260px; border-radius: 16px; background: rgba(10,23,44,0.58); animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }

/* 空 / 错误 */
.empty-state, .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 16px; gap: 12px; }
.empty-icon { font-size: 48px; }
.empty-title { font-size: 20px; font-weight: 600; color: #fff; }
.empty-sub { color: var(--muted); font-size: 14px; }
.error-card { padding: 40px; text-align: center; max-width: 400px; border-radius: 16px; }
.error-icon { font-size: 40px; margin-bottom: 12px; }
.error-msg { font-size: 16px; color: #fff; font-weight: 600; }
.error-hint { font-size: 13px; color: var(--muted); margin-top: 4px; }
.retry-btn { margin-top: 16px; padding: 10px 28px; border-radius: 10px; border: 1px solid rgba(86,199,255,0.4); background: rgba(86,199,255,0.1); color: var(--cyan); cursor: pointer; font-size: 14px; transition: all 0.2s; }
.retry-btn:hover { background: rgba(86,199,255,0.2); }

.glass-card { background: rgba(10,23,44,0.58); border: 1px solid rgba(158,216,255,0.16); backdrop-filter: blur(18px); }

@media (max-width: 768px) {
  .catalog-header-inner { flex-direction: column; align-items: flex-start; }
  .header-stats { gap: 20px; }
  .catalog-controls { flex-direction: column; align-items: flex-start; }
  .search-wrap { max-width: 100%; width: 100%; }
  .cards-grid { grid-template-columns: 1fr; padding: 0 16px; }
}
</style>
