import { Router } from 'express'
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

interface StrategyData {
  seed: number
  name: string
  navCategory: string
  category: string
  structure: string
  outlookStars: number
  owner: string
  startDate: string
  logicSummary: string
  positioning: string
  tags: string[]
  annualReturn: number
  winRate: number
  maxDrawdown: number
  volatility: number
  sharpe: number
  benchmarkName: string
  timeSeries?: Record<string, TimeSeriesPoint[]>
}

let strategiesCache: Record<string, StrategyData> | null = null

function getStrategiesData(): Record<string, StrategyData> {
  if (!strategiesCache) {
    const filePath = path.join(__dirname, '..', 'data', 'strategies.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    // Replace NaN with null for valid JSON
    const clean = raw.replace(/\bNaN\b/g, 'null')
    strategiesCache = JSON.parse(clean) as Record<string, StrategyData>
  }
  return strategiesCache
}

const router = Router()

// GET /strategies - List all strategies (metadata only)
router.get('/strategies', (_req, res) => {
  const requestId = res.locals.requestId
  const all = getStrategiesData()
  const strategies = Object.values(all).map(({ timeSeries: _ts, ...meta }) => meta)
  res.json(successResponse({ strategies }, requestId))
})

// GET /strategies/:id - Get single strategy metadata
router.get('/strategies/:id', (req, res) => {
  const requestId = res.locals.requestId
  const id = req.params.id
  const all = getStrategiesData()
  const strategy = all[id]
  if (!strategy) {
    return res.status(404).json({ code: 404, message: `策略不存在: ${id}`, requestId })
  }
  const { timeSeries: _ts, ...meta } = strategy
  res.json(successResponse({ strategy: meta }, requestId))
})

// GET /strategies/:id/timeseries - Get real NAV time series
router.get('/strategies/:id/timeseries', (req, res) => {
  const requestId = res.locals.requestId
  const id = req.params.id
  const period = (req.query.period as string) || 'inception'
  const all = getStrategiesData()
  const strategy = all[id]
  if (!strategy) {
    return res.status(404).json({ code: 404, message: `策略不存在: ${id}`, requestId })
  }
  const ts = strategy.timeSeries || {}
  const periodData = ts[period] || []
  res.json(successResponse({
    strategyId: id,
    strategyName: strategy.name,
    benchmarkName: strategy.benchmarkName,
    period,
    data: periodData,
  }, requestId))
})

export default router
