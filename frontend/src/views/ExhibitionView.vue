<template>
  <div class="display" ref="rootEl" tabindex="-1" @keydown="onKey">

    <!-- ═══ 顶部状态栏 ═══ -->
    <div class="topbar">
      <div class="brand">
        <div class="brand-g">G</div>
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
        <div class="total">{{ all.length }} 条策略</div>
        <button class="exit-btn" @click="exit">✕</button>
      </div>
    </div>

    <!-- ═══ 主体 ═══ -->
    <div class="body" v-if="current">

      <!-- 策略名称横条 -->
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
            <button @click.stop="next">▶</button>
          </div>
        </div>
      </div>

      <!-- 三列内容 -->
      <div class="cols">

        <!-- 左：基本信息 -->
        <div class="col col-left">
          <div class="sec">
            <div class="sec-title">基本信息</div>
            <div class="info-list">
              <div class="info-row"><span class="ik">策略名称</span><span class="iv">{{ current.name }}</span></div>
              <div class="info-row"><span class="ik">策略分类</span><span class="iv">{{ current.navCategory }}</span></div>
              <div class="info-row"><span class="ik">管理者</span><span class="iv">{{ current.owner || '—' }}</span></div>
              <div class="info-row"><span class="ik">成立时间</span><span class="iv">{{ current.startDate || '—' }}</span></div>
              <div class="info-row"><span class="ik">比较基准</span><span class="iv">{{ current.benchmarkName || '—' }}</span></div>
              <div class="info-row">
                <span class="ik">风险等级</span>
                <span class="iv">
                  <span class="risk-badge" :class="'risk-' + ((current as any).riskLevel || 'R3')">
                    {{ ((current as any).riskLevel || 'R3') }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div class="sec">
            <div class="sec-title">策略逻辑</div>
            <div class="sec-text">{{ current.logicSummary || '暂无说明' }}</div>
          </div>

          <div class="sec">
            <div class="sec-title">策略定位</div>
            <div class="sec-text muted">{{ current.positioning || '暂无说明' }}</div>
          </div>
        </div>

        <!-- 中：核心指标 -->
        <div class="col col-center">
          <div class="kpi-block">
            <div class="kpi-giant">
              <div class="kgv" :class="current.annualReturn >= 0 ? 'gain' : 'loss'">
                {{ current.annualReturn >= 0 ? '+' : '' }}{{ current.annualReturn.toFixed(2) }}%
              </div>
              <div class="kgl">年化收益率</div>
              <div class="kga" :class="alpha >= 0 ? 'gain' : 'loss'">
                基准 {{ alpha >= 0 ? '+' : '' }}{{ alpha.toFixed(2) }}%
              </div>
            </div>
            <div class="kpi-minis">
              <div class="km">
                <div class="kmv">{{ current.winRate.toFixed(0) }}%</div>
                <div class="kml">年度胜率</div>
              </div>
              <div class="km">
                <div class="kmv loss">-{{ ((current as any).maxDrawdown || 0).toFixed(2) }}%</div>
                <div class="kml">最大回撤</div>
              </div>
              <div class="km">
                <div class="kmv">{{ ((current as any).sharpe || 0).toFixed(2) }}</div>
                <div class="kml">夏普比率</div>
              </div>
            </div>
          </div>
          <div class="chart-area">
            <canvas ref="canvasEl"></canvas>
          </div>
        </div>

        <!-- 右：评级 + AI -->
        <div class="col col-right">
          <div class="sec">
            <div class="sec-title">综合评级</div>
            <div class="stars">
              <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= (current.outlookStars || 3) }">★</span>
            </div>
          </div>

          <div class="sec">
            <div class="sec-title">⭐ AI 推荐理由</div>
            <div class="reasons">
              <div v-for="(r, i) in currentTierReasons" :key="i" class="reason">
                <span class="rn">{{ i + 1 }}</span>
                <span class="rt">{{ r }}</span>
              </div>
            </div>
          </div>

          <div class="narrative-panel" v-if="aiNarrative || aiLoading">
            <div class="narrative-header">
              <span class="nh-icon">🧠</span>
              <span class="nh-title">AI 策略对比分析</span>
              <button class="nh-btn" @click="regenerateNarrative" :disabled="aiLoading">
                {{ aiLoading ? '生成中...' : '🔄' }}
              </button>
            </div>
            <div class="narrative-body" v-if="aiNarrative">{{ aiNarrative }}</div>
            <div class="narrative-loading" v-else><span class="spin"></span> AI 分析中...</div>
          </div>
          <button v-else class="gen-btn" @click="regenerateNarrative">🧠 生成 AI 对比分析</button>
        </div>

      </div>

      <!-- 底部分类导航 -->
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

    <!-- 加载 -->
    <div class="state-center" v-if="loading">
      <div class="ring"></div>
      <div class="state-text">加载中...</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { listStrategies, type StrategyItem } from '../services/strategy'

const router = useRouter()
const rootEl = ref<HTMLDivElement>()
const canvasEl = ref<HTMLCanvasElement>()

// ── State ──────────────────────────────────
const all = ref<StrategyItem[]>([])
const catIdx = ref(0)
const stratIdx = ref(0)
const clock = ref('')
const aiNarrative = ref('')
const aiLoading = ref(false)
const loading = ref(true)
let isActive = false
let clockTimer: ReturnType<typeof setInterval> | null = null
let autoTimer: ReturnType<typeof setInterval> | null = null
const tsCache: Record<string, any[]> = {}

// ── Data ──────────────────────────────────
const categories = computed(() => {
  const map: Record<string, StrategyItem[]> = {}
  for (const s of all.value) {
    const cat = s.navCategory || '其他'
    if (!map[cat]) map[cat] = []
    map[cat].push(s)
  }
  return Object.entries(map).map(([name, strategies]) => ({ name, strategies }))
    .sort((a, b) => b.strategies.length - a.strategies.length)
})
const catStrats = computed(() => categories.value[catIdx.value]?.strategies || [])
const current = computed(() => catStrats.value[stratIdx.value] || null)

const globalRank = computed(() => {
  if (!current.value) return '—'
  const i = all.value.findIndex(s => s.seed === current.value!.seed)
  return i === -1 ? '—' : String(i + 1)
})

const alpha = computed(() => {
  const bm: Record<string, number> = { '中证800': 3.1, '万得偏股混合型基金指数': 5.8, '中证500': 2.4, '理财收益': 4.0, '华安黄金ETF': 6.2, '一级债基指数': 3.8 }
  return (current.value?.annualReturn || 0) - (bm[current.value?.benchmarkName || ''] ?? 4.5)
})

// ── AI Tier ──────────────────────────────────
const catRanked = computed(() => {
  const cs = catStrats.value
  return [...cs].sort((a, b) => {
    return (b.annualReturn - a.annualReturn)
  })
})
const currentTier = computed(() => {
  const i = catRanked.value.findIndex(s => s.seed === current.value?.seed)
  if (i === 0) return { icon: '⭐', label: '首选推荐', badge: 'primary' }
  if (i === 1) return { icon: '💡', label: '备选关注', badge: 'alternative' }
  return { icon: '📌', label: '了解即可', badge: 'cautionary' }
})
const currentTierReasons = computed(() => {
  if (!current.value) return []
  const s = current.value
  const reasons: string[] = []
  if ((s.annualReturn || 0) >= 15) reasons.push(`年化收益${s.annualReturn.toFixed(1)}%，同类策略领先`)
  if ((s.winRate || 0) >= 80) reasons.push(`胜率${s.winRate.toFixed(0)}%，持续盈利能力突出`)
  if ((s as any).sharpe >= 1.5) reasons.push(`夏普比率${((s as any).sharpe).toFixed(2)}，风险收益效率优秀`)
  if ((s as any).maxDrawdown && (s as any).maxDrawdown <= 10) reasons.push(`最大回撤${((s as any).maxDrawdown).toFixed(1)}%，风控良好`)
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
  clock.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
    if (isActive) nextTick(() => drawChart())
  }
}

// ── Chart ──────────────────────────────────
function getTS(seed: number) { return tsCache[String(seed)] || [] }

async function fetchTS(seed: number) {
  if (tsCache[String(seed)]) return
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003'
    const resp = await fetch(`${base}/strategies/${seed}/timeseries?period=year`)
    const data = await resp.json() as any
    const raw = (data.data || data).data || []
    tsCache[String(seed)] = raw.map((p: any) => ({ date: p.date, y: p.ret || 0 }))
  } catch { tsCache[String(seed)] = [] }
}

function drawChart() {
  if (!canvasEl.value || !current.value) return
  const pts = getTS(current.value.seed)
  const canvas = canvasEl.value
  const ctx = canvas.getContext('2d')
  if (!ctx || pts.length === 0) return
  const w = canvas.parentElement?.clientWidth || 700
  const h = canvas.parentElement?.clientHeight || 240
  canvas.width = w; canvas.height = h
  const vals = pts.map(p => p.y)
  const mn = Math.min(...vals), mx = Math.max(...vals)
  const rng = mx - mn || 1
  const pad = 8, sx = (w - pad * 2) / Math.max(pts.length - 1, 1)
  ctx.clearRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(245,158,11,0.07)'; ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) { const y = pad + (h - pad * 2) * i / 4; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke() }
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5; ctx.beginPath()
  pts.forEach((p, i) => {
    const x = pad + i * sx, y = pad + (1 - (p.y - mn) / rng) * (h - pad * 2)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }); ctx.stroke()
  ctx.fillStyle = 'rgba(245,158,11,0.08)'; ctx.lineTo(pad + (pts.length - 1) * sx, h - pad); ctx.lineTo(pad, h - pad); ctx.closePath(); ctx.fill()
}

// ── Narrative ──────────────────────────────────
async function regenerateNarrative() {
  const top = catRanked.value.slice(0, 4)
  if (!top.length) return
  aiLoading.value = true
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003'
    const resp = await fetch(`${base}/api/recommend-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategies: top }),
    })
    const data = await resp.json() as any
    aiNarrative.value = (data.data?.narrative) || '（暂无分析）'
  } catch { aiNarrative.value = '（AI 暂时不可用）' }
  finally { aiLoading.value = false }
}

// ── Watch ──────────────────────────────────
watch([catIdx, stratIdx], () => {
  if (!isActive || !current.value) return
  fetchTS(current.value.seed)
  nextTick(() => drawChart())
})

// ── Lifecycle ──────────────────────────────────
onMounted(async () => {
  isActive = true
  rootEl.value?.focus()
  startClock()
  await load()
  autoTimer = setInterval(() => { if (isActive) next() }, 7000)
  if (current.value) fetchTS(current.value.seed)
  nextTick(() => drawChart())
  regenerateNarrative()
})

onUnmounted(() => {
  isActive = false
  if (clockTimer) clearInterval(clockTimer)
  if (autoTimer) clearInterval(autoTimer)
})
</script>

<style scoped>
/* ══ Page ══ */
.display {
  position: fixed; inset: 0; background: #050810;
  display: flex; flex-direction: column; outline: none;
  font-family: 'DIN Alternate','Bahnschrift','Segoe UI',system-ui,sans-serif;
  color: #fff; overflow: hidden;
}

/* ══ Topbar ══ */
.topbar {
  display: flex; align-items: center; height: 64px; padding: 0 28px;
  background: #06090f; border-bottom: 1px solid rgba(245,158,11,0.12); flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-g { width: 38px; height: 38px; background: linear-gradient(135deg,#9e722e,#c24a00); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: #fff; flex-shrink: 0; }
.brand-name { font-size: 17px; font-weight: 700; color: #fff; white-space: nowrap; }
.topbar-center { flex: 1; padding: 0 24px; overflow: hidden; }
.cat-tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.cat-tabs::-webkit-scrollbar { display: none; }
.cat-tab { padding: 7px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 13px; white-space: nowrap; transition: all 0.2s; }
.cat-tab:hover { border-color: rgba(245,158,11,0.3); color: rgba(245,158,11,0.7); }
.cat-tab.active { border-color: #f59e0b; background: rgba(245,158,11,0.1); color: #f59e0b; font-weight: 700; }
.topbar-right { display: flex; align-items: center; gap: 18px; }
.clock { font-size: 22px; font-weight: 700; color: rgba(245,158,11,0.65); font-family: 'DIN Alternate','Bahnschrift',monospace; letter-spacing: 0.05em; }
.total { font-size: 13px; color: rgba(255,255,255,0.35); }
.total::before { content: ''; font-size: 16px; font-weight: 800; color: rgba(245,158,11,0.7); margin-right: 4px; }
.exit-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 13px; transition: all 0.2s; }
.exit-btn:hover { border-color: rgba(255,255,255,0.35); color: #fff; }

/* ══ Namebar ══ */
.namebar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 28px;
  background: rgba(245,158,11,0.05); border-bottom: 1px solid rgba(245,158,11,0.12);
  cursor: pointer; flex-shrink: 0; transition: background 0.2s;
}
.namebar:hover { background: rgba(245,158,11,0.09); }
.nb-left { display: flex; align-items: baseline; gap: 16px; }
.nb-cat { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(245,158,11,0.75); }
.nb-name { font-size: 28px; font-weight: 900; color: #fff; }
.nb-owner { font-size: 13px; color: rgba(255,255,255,0.35); }
.nb-right { display: flex; align-items: center; gap: 10px; }
.nb-tier { display: flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; border: 1.5px solid; }
.nb-tier.tier-primary { background: rgba(74,222,128,0.12); border-color: rgba(74,222,128,0.4); color: #4ade80; }
.nb-tier.tier-alternative { background: rgba(88,199,255,0.1); border-color: rgba(88,199,255,0.3); color: #58c7ff; }
.nb-tier.tier-cautionary { background: rgba(229,163,71,0.1); border-color: rgba(229,163,71,0.25); color: #e5a347; }
.nb-tag { font-size: 12px; padding: 3px 10px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.45); }
.nb-sep { color: rgba(255,255,255,0.15); margin: 0 4px; }
.nb-rank { font-size: 13px; color: rgba(255,255,255,0.35); }
.nb-rank strong { color: rgba(245,158,11,0.75); }
.nb-ctrl { display: flex; align-items: center; gap: 8px; }
.nb-ctrl button { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.nb-ctrl button:hover { border-color: rgba(245,158,11,0.4); color: #f59e0b; }
.nb-ctrl span { font-size: 13px; color: rgba(255,255,255,0.4); min-width: 40px; text-align: center; }

/* ══ Body ══ */
.body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* ══ Cols ══ */
.cols { flex: 1; display: grid; grid-template-columns: 260px 1fr 280px; overflow: hidden; }
.col { overflow-y: auto; overscroll-behavior: contain; padding: 20px; }
.col-left { border-right: 1px solid rgba(255,255,255,0.04); }
.col-center { display: flex; flex-direction: column; gap: 16px; padding: 20px; overflow: hidden; }
.col-right { border-left: 1px solid rgba(255,255,255,0.04); }

/* ══ Sections ══ */
.sec { margin-bottom: 22px; }
.sec-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(245,158,11,0.65); margin-bottom: 10px; }
.sec-text { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.75; }
.sec-text.muted { color: rgba(255,255,255,0.35); font-style: italic; }
.info-list { display: flex; flex-direction: column; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
.ik { color: rgba(255,255,255,0.35); }
.iv { color: rgba(255,255,255,0.88); font-weight: 600; }
.reasons { display: flex; flex-direction: column; gap: 9px; }
.reason { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.62); line-height: 1.55; }
.rn { width: 20px; height: 20px; border-radius: 50%; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25); color: #f59e0b; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* ══ KPI ══ */
.kpi-block { display: flex; gap: 16px; align-items: center; flex-shrink: 0; }
.kpi-giant { flex: 1; text-align: center; }
.kgv { font-size: 72px; font-weight: 900; line-height: 1; letter-spacing: -0.02em; }
.kgv.gain { color: #e85d04; }
.kgv.loss { color: #58a6a6; }
.kgl { font-size: 13px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 6px; }
.kga { font-size: 16px; font-weight: 700; margin-top: 4px; font-family: 'DIN Alternate','Bahnschrift',monospace; }
.kga.gain { color: #e85d04; }
.kga.loss { color: #58a6a6; }
.kpi-minis { display: flex; flex-direction: column; gap: 8px; }
.km { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 12px 18px; background: rgba(255,255,255,0.04); border-radius: 12px; }
.kmv { font-size: 26px; font-weight: 900; font-family: 'DIN Alternate','Bahnschrift',monospace; color: #fff; }
.kmv.loss { color: #58a6a6; }
.kml { font-size: 10px; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.08em; }

/* ══ Chart ══ */
.chart-area { flex: 1; min-height: 0; }
.chart-area canvas { width: 100%; height: 100%; display: block; }

/* ══ Stars ══ */
.stars { display: flex; gap: 5px; }
.star { font-size: 30px; color: rgba(255,255,255,0.1); }
.star.filled { color: #f59e0b; }

/* ══ Narrative ══ */
.narrative-panel { background: rgba(255,252,246,0.04); border: 1px solid rgba(245,158,11,0.15); border-radius: 14px; padding: 16px; }
.narrative-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.nh-icon { font-size: 18px; }
.nh-title { font-size: 13px; font-weight: 700; color: rgba(245,158,11,0.8); flex: 1; }
.nh-btn { background: none; border: 1px solid rgba(245,158,11,0.18); color: rgba(245,158,11,0.55); padding: 4px 10px; border-radius: 7px; cursor: pointer; font-size: 12px; }
.nh-btn:hover:not(:disabled) { border-color: rgba(245,158,11,0.5); color: #f59e0b; }
.nh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.narrative-body { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.9; white-space: pre-wrap; }
.narrative-loading { font-size: 13px; color: rgba(255,255,255,0.3); display: flex; align-items: center; gap: 8px; }
.gen-btn { width: 100%; padding: 14px; border-radius: 10px; border: 1px dashed rgba(245,158,11,0.25); background: rgba(245,158,11,0.05); color: rgba(245,158,11,0.6); cursor: pointer; font-size: 13px; transition: all 0.2s; }
.gen-btn:hover { border-color: rgba(245,158,11,0.5); color: #f59e0b; }

/* ══ Risk ══ */
.risk-badge { display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 5px; letter-spacing: 0.05em; }
.risk-badge.risk-R3 { background: rgba(245,158,11,0.15); color: #f59e0b; }
.risk-badge.risk-R4 { background: rgba(249,115,22,0.15); color: #f97316; }
.risk-badge.risk-R5 { background: rgba(248,113,113,0.15); color: #f87171; }

/* ══ Bottom ══ */
.bottombar { padding: 10px 28px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
.bd { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 12px; transition: all 0.2s; }
.bd:hover { border-color: rgba(245,158,11,0.3); color: rgba(245,158,11,0.7); }
.bd.active { border-color: #f59e0b; background: rgba(245,158,11,0.1); color: #f59e0b; font-weight: 700; }
.bc { font-size: 11px; opacity: 0.7; }

/* ══ State ══ */
.state-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
.ring { width: 48px; height: 48px; border: 3px solid rgba(245,158,11,0.15); border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.2); border-top-color: rgba(245,158,11,0.7); border-radius: 50%; animation: spin 0.7s linear infinite; }
.state-text { color: rgba(255,255,255,0.4); font-size: 14px; }
</style>
