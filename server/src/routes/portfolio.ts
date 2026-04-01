import { Router } from 'express'
import { aiService } from '../services/ai-service'
import { errorResponse } from '../utils/response'
import { successResponse } from '../utils/response'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface TimeSeriesPoint {
  date: string
  ret: number | null
  benchmark: number | null
}

interface StrategyMeta {
  seed: number
  name: string
  navCategory: string
  annualReturn: number
  winRate: number
  maxDrawdown: number
  volatility: number
  sharpe: number
  benchmarkName: string
}

let metaCache: StrategyMeta[] | null = null
let tsCache: Record<string, TimeSeriesPoint[]> | null = null

function getMeta(): StrategyMeta[] {
  if (!metaCache) {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'strategies-enhanced.json'), 'utf-8')
    const data = JSON.parse(raw)
    metaCache = data.strategies
  }
  return metaCache
}

function getTS(): Record<string, TimeSeriesPoint[]> {
  if (!tsCache) {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'strategies-timeseries.json'), 'utf-8')
    tsCache = JSON.parse(raw)
  }
  return tsCache
}

function getAllStrategies(): StrategyMeta[] {
  return getMeta()
}

const router = Router()

// GET /portfolio/strategies
router.get('/portfolio/strategies', (_req, res) => {
  const requestId = res.locals.requestId
  res.json(successResponse({ strategies: getAllStrategies() }, requestId))
})

// Derive period returns from cumulative percentage series.
// ret values are in percentage form: 5.09 means 5.09% cumulative.
function toPeriodReturns(ts: TimeSeriesPoint[]): number[] {
  const rets: number[] = []
  for (let i = 1; i < ts.length; i++) {
    const prev = ts[i - 1].ret ?? 0
    const curr = ts[i].ret ?? 0
    // Period return in percentage points (curr - prev), divided by 100 to get decimal
    const periodRet = (curr - prev) / 100
    rets.push(periodRet)
  }
  return rets
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1))
}

// Number of calendar days spanned by the time series
function seriesDays(ts: TimeSeriesPoint[]): number {
  if (ts.length < 2) return 252
  const first = ts[0].date, last = ts[ts.length - 1].date
  const d0 = new Date(first.slice(0, 4), parseInt(first.slice(4, 6)) - 1, first.slice(6, 8))
  const d1 = new Date(last.slice(0, 4), parseInt(last.slice(4, 6)) - 1, last.slice(6, 8))
  return Math.max(1, Math.round((d1.getTime() - d0.getTime()) / 86400000))
}

// Compute max drawdown from cumulative return series (in percentage points)
function computeMaxDD(ts: TimeSeriesPoint[]): number {
  let peak = 0, maxDD = 0
  for (const pt of ts) {
    const curr = pt.ret ?? 0
    if (curr > peak) peak = curr
    const dd = curr - peak
    if (dd < maxDD) maxDD = dd
  }
  return maxDD // in percentage points
}

// Annualization factor based on actual days in series
function annualizationFactor(ts: TimeSeriesPoint[]): number {
  const days = seriesDays(ts)
  // Assume ~252 trading days per year
  return Math.sqrt(252 / Math.max(days, 1))
}

// Compute annualized return from cumulative NAV series
function deriveAnnualReturn(ts: TimeSeriesPoint[]): number {
  if (!ts || ts.length < 2) return 0
  const first = ts[0], last = ts[ts.length - 1]
  // Parse dates
  const d0 = new Date(`${first.date.slice(0, 4)}-${first.date.slice(4, 6)}-${first.date.slice(6, 8)}`)
  const d1 = new Date(`${last.date.slice(0, 4)}-${last.date.slice(4, 6)}-${last.date.slice(6, 8)}`)
  const yearsMs = d1.getTime() - d0.getTime()
  const years = Math.max(yearsMs / (1000 * 60 * 60 * 24 * 365.25), 0.1)
  const totalRetDecimal = ((last.ret ?? 0) - (first.ret ?? 0)) / 100
  // Annualized: (1 + total_return)^(1/years) - 1
  const annRet = (Math.pow(Math.max(1 + totalRetDecimal, 0.001), 1 / years) - 1) * 100
  return annRet
}

// Default correlation between strategies for portfolio combination
const STRATEGY_CORRELATION = 0.30

// POST /api/portfolio-narrative — 组合分析 AI 解读

router.post('/api/portfolio-narrative', async (req, res) => {
  const requestId = res.locals.requestId
  try {
    const { components, portfolioReturn, portfolioMaxDrawdown, portfolioSharpe } = req.body as {
      components: any[]
      portfolioReturn?: number
      portfolioMaxDrawdown?: number
      portfolioSharpe?: number
    }
    if (!components?.length) {
      return res.status(400).json(errorResponse('components 不能为空', requestId))
    }
    const compText = components.map((c: any, i: number) =>
      `子策略${i + 1} ${c.name}（${c.navCategory}）：权重${c.weight}%，年化收益${c.annualReturn >= 0 ? '+' : ''}${c.annualReturn?.toFixed?.(2) ?? '0'}%，最大回撤${c.maxDrawdown?.toFixed?.(2) ?? '0'}%，波动率${c.volatility?.toFixed?.(2) ?? '0'}%。`
    ).join('\n')
    const prompt = `
你是光大资管的高级投资顾问。请根据以下组合持仓信息，生成一段专业的组合分析解读。

【组合概况】
- 组合年化收益率：${portfolioReturn >= 0 ? '+' : ''}${(portfolioReturn ?? 0).toFixed(2)}%
- 组合最大回撤：-${(portfolioMaxDrawdown ?? 0).toFixed(2)}%
- 组合夏普比率：${(portfolioSharpe ?? 0).toFixed(2)}
- 子策略数量：${components.length}

【子策略详情】
${compText}

【生成要求】
请生成一段**不少于600字**的组合分析解读，包含：
1. 组合整体表现评价（收益、风险、风险调整收益）
2. 各子策略的贡献和特点分析
3. 组合配置的合理性和互补性
4. 风险提示
5. 配置建议

语言风格：专业、详尽、通俗。直接输出正文，不使用markdown格式。
`
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    try {
      const text = await aiService.generateText(prompt)
      res.write(text)
      res.end()
    } catch {
      res.write('（AI 组合解读暂时不可用，请稍后重试）')
      res.end()
    }
  } catch (err: any) {
    console.error(`[${requestId}] portfolio-narrative error:`, err.message)
    res.status(500).json(errorResponse('组合解读生成失败', requestId))
  }
})

// POST /portfolio/simulate
router.post('/portfolio/simulate', (req, res) => {
  const requestId = res.locals.requestId
  const { allocations, period = 'inception' } = req.body as {
    allocations: { strategyId: string; weight: number }[]
    period: string
  }

  if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
    return res.status(400).json({ code: 400, message: 'allocations required', requestId })
  }
  if (allocations.length > 10) {
    return res.status(400).json({ code: 400, message: 'max 10 strategies', requestId })
  }

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0)
  if (Math.abs(totalWeight - 100) > 0.1) {
    return res.status(400).json({
      code: 400,
      message: `weights must sum to 100 (got ${totalWeight.toFixed(1)})`,
      requestId,
    })
  }

  const allMeta = getMeta()
  const allTS = getTS()
  const metaById = new Map(allMeta.map(s => [String(s.seed), s]))

  for (const a of allocations) {
    if (!metaById.has(a.strategyId)) {
      return res.status(400).json({ code: 400, message: `strategy ${a.strategyId} not found`, requestId })
    }
  }

  try {
    // Per-strategy metrics: use strategy's own pre-computed values where available
    const components = allocations.map(a => {
      const s = metaById.get(a.strategyId)!
      const ts = (allTS[String(s.seed)] || []).sort((a, b) => a.date.localeCompare(b.date))
      const annFactor = annualizationFactor(ts)

      // Use strategy's own annual return; if 0 but time series exists, compute from series
      let annRet = s.annualReturn || 0
      if (annRet === 0 && ts.length >= 2) {
        annRet = deriveAnnualReturn(ts)
      }

      // Volatility: prefer pre-computed; if missing, derive from time series
      let vol = s.volatility || 0
      if ((!vol) && ts.length >= 2) {
        const rets = toPeriodReturns(ts)
        if (rets.length >= 2) {
          vol = stddev(rets) * annFactor * 100
        }
      }

      // Max drawdown: prefer pre-computed; if missing, compute from series
      let maxDD = s.maxDrawdown || 0
      if ((!maxDD) && ts.length > 1) {
        maxDD = Math.abs(computeMaxDD(ts))
      }

      return {
        strategyId: String(s.seed),
        name: s.name,
        navCategory: s.navCategory,
        weight: Math.round(a.weight * 10) / 10,
        weightFrac: a.weight / totalWeight,
        annualReturn: Math.round(annRet * 100) / 100,
        volatility: Math.round(vol * 100) / 100,
        maxDrawdown: Math.round(maxDD * 100) / 100,
      }
    })

    // Portfolio weighted return
    const portfolioReturn = components.reduce((sum, c) => sum + c.weightFrac * c.annualReturn, 0)

    // Portfolio volatility: σ²_p = Σ_i Σ_j w_i w_j ρ_ij σ_i σ_j
    let volVar = 0
    for (let i = 0; i < components.length; i++) {
      for (let j = 0; j < components.length; j++) {
        const ci = components[i], cj = components[j]
        const corr = i === j ? 1.0 : STRATEGY_CORRELATION
        volVar += ci.weightFrac * cj.weightFrac * corr * (ci.volatility / 100) * (cj.volatility / 100)
      }
    }
    const portfolioVol = Math.sqrt(Math.max(0, volVar)) * 100

    // Portfolio max drawdown: weighted average (simplified, ignoring correlation)
    const portfolioMaxDD = components.reduce((sum, c) => sum + c.weightFrac * c.maxDrawdown, 0)

    // Sharpe: assume risk-free rate = 0 for now
    const portfolioSharpe = portfolioVol > 0 ? portfolioReturn / portfolioVol : 0

    const result = {
      period,
      totalWeight: Math.round(totalWeight * 10) / 10,
      portfolioReturn: Math.round(portfolioReturn * 100) / 100,
      portfolioVolatility: Math.round(portfolioVol * 100) / 100,
      portfolioMaxDrawdown: Math.round(portfolioMaxDD * 100) / 100,
      portfolioSharpe: Math.round(portfolioSharpe * 100) / 100,
      components: components.map(c => ({
        strategyId: c.strategyId,
        name: c.name,
        navCategory: c.navCategory,
        weight: c.weight,
        annualReturn: c.annualReturn,
        volatility: c.volatility,
        maxDrawdown: c.maxDrawdown,
      })),
    }

    res.json(successResponse(result, requestId))
  } catch (err) {
    console.error('[portfolio/simulate] error:', err)
    res.status(500).json({ code: 500, message: 'calculation error', requestId })
  }
})

export default router
