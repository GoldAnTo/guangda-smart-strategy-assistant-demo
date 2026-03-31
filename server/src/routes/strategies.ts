import { Router } from 'express'
import { successResponse } from '../utils/response'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 静态导入策略元数据（JSON小，可以打包）
const strategiesData = JSON.parse(readFileSync(path.join(__dirname, '..', 'data', 'strategies-enhanced.json'), 'utf-8'))

// 动态读取 timeseries（文件大，避免打包）
let _tsData: Record<string, any[]> | null = null
function getTSData() {
  if (!_tsData) {
    _tsData = JSON.parse(readFileSync(path.join(__dirname, '..', 'data', 'strategies-timeseries.json'), 'utf-8'))
  }
  return _tsData
}

type StrategyData = (typeof strategiesData)['strategies'][number]

// 同时支持 seed（数字）和 id（GS-XX格式）两种key
const strategiesBySeed = new Map<string, StrategyData>(
  strategiesData.strategies.map(s => [String(s.seed), s])
)
const strategiesById = new Map<string, StrategyData>(
  strategiesData.strategies.map(s => [String(s.id), s])
)

function findStrategy(id: string): StrategyData | undefined {
  return strategiesBySeed.get(id) || strategiesById.get(id)
}

const periodFilters: Record<string, (pts: { date: string }[]) => { date: string; ret: number; benchmark: number }[]> = {
  week: pts => pts.slice(-5),
  month: pts => pts.slice(-22),
  quarter: pts => pts.slice(-65),
  year: pts => pts.slice(-252),
  inception: pts => pts,
}

const router = Router()

// GET /strategies - List all strategies
router.get('/strategies', (_req, res) => {
  const requestId = res.locals.requestId
  res.json(successResponse({ strategies: strategiesData.strategies }, requestId))
})

// GET /strategies/:id - 支持 seed数字(55) 和 id格式(GS-55)
router.get('/strategies/:id', (req, res) => {
  const requestId = res.locals.requestId
  const id = req.params.id
  const strategy = findStrategy(id)
  if (!strategy) {
    return res.status(404).json({ code: 404, message: `策略不存在: ${id}`, requestId })
  }
  res.json(successResponse({ strategy }, requestId))
})

// GET /strategies/:id/timeseries - 真实历史净值
router.get('/strategies/:id/timeseries', (req, res) => {
  const requestId = res.locals.requestId
  const id = req.params.id
  const period = (req.query.period as string) || 'inception'
  const strategy = findStrategy(id)
  if (!strategy) {
    return res.status(404).json({ code: 404, message: `策略不存在: ${id}`, requestId })
  }

  const ts = getTSData()[String(strategy.seed)] || []
  const filter = periodFilters[period] || periodFilters.inception
  const data = filter(ts).map(pt => ({
    date: pt.date,
    ret: pt.ret,
    benchmark: pt.benchmark,
  }))

  res.json(successResponse({
    strategyId: String(strategy.seed),
    strategyName: strategy.name,
    benchmarkName: strategy.benchmarkName,
    period,
    data,
  }, requestId))
})

export default router
