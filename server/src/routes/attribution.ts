import { Router } from 'express'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

// 测试端点
router.get('/api/attribution/test', (_req, res) => {
  res.json(successResponse({ test: 'ok', message: 'attribution route is loaded' }))
})

// 快速测试端点（返回模拟数据）
router.get('/api/attribution/quicktest', (_req, res) => {
  res.json(successResponse({
    strategyName: '量化alpha对冲',
    period: '近一月',
    periodReturn: 12.5,
    annualReturn: 12.5,
    maxDrawdown: 8.5,
    winRate: 68,
    volatility: 9.2,
    sharpe: 1.47,
    riskLevel: '中高风险',
    marketInsight: '近期量化策略受益于市场波动率上升，alpha策略表现优于基准。',
    strategyDriver: '核心驱动因素为选股超额收益和衍生品对冲效率。',
    riskRewardAnalysis: '夏普比率1.47，属于优秀水平；最大回撤8.5%，风险可控。',
    configValue: '建议配置比例20-30%，持有期限6个月以上，关注波动率指标。',
    summary: '量化alpha对冲策略在当前市场环境下表现优秀，适合追求绝对收益的投资者。',
    riskWarning: '历史业绩不代表未来表现，请关注市场风险和管理人能力。',
  }))
})

// 根据策略指标生成归因分析（纯规则引擎，无需 AI）
function generateAttribution(strategy: {
  name: string
  navCategory: string
  annualReturn: number
  winRate: number
  maxDrawdown: number
  volatility: number
  sharpe: number
  riskLevel: string
  investmentHorizon?: string
  logicSummary?: string
  tags?: string[]
}, period: string, periodReturn: number) {
  const r = strategy
  const riskMap: Record<string, string> = {
    R1: '低风险', R2: '中低风险', R3: '中等风险', R4: '中高风险', R5: '高风险'
  }
  const riskText = riskMap[r.riskLevel] || r.riskLevel || '中等风险'

  // 年化收益分析
  let returnInsight = ''
  if (r.annualReturn >= 20) returnInsight = `年化收益率达${r.annualReturn.toFixed(1)}%，表现极强，处于同类策略前茅。`
  else if (r.annualReturn >= 12) returnInsight = `年化收益率${r.annualReturn.toFixed(1)}%，跑赢多数同类竞品，具备显著超额收益。`
  else if (r.annualReturn >= 5) returnInsight = `年化收益率${r.annualReturn.toFixed(1)}%，高于存款利率和债券基准，超额收益为正。`
  else if (r.annualReturn >= 0) returnInsight = `年化收益率${r.annualReturn.toFixed(1)}%，正收益但低于市场平均水平。`
  else returnInsight = `年化收益率为负（${r.annualReturn.toFixed(1)}%），需关注市场系统性风险。`

  // 胜率分析
  let winInsight = ''
  if (r.winRate >= 80) winInsight = `胜率高达${r.winRate.toFixed(0)}%，盈利稳定性极强。`
  else if (r.winRate >= 65) winInsight = `胜率${r.winRate.toFixed(0)}%，正收益月份占比超过半数，业绩持续性较好。`
  else if (r.winRate >= 50) winInsight = `胜率${r.winRate.toFixed(0)}%，正负月基本持平，趋势跟随能力有待提升。`
  else winInsight = `胜率仅${r.winRate.toFixed(0)}%，负收益月份偏多，策略大概率处于回撤期。`

  // 最大回撤分析
  let riskInsight = ''
  if (r.maxDrawdown <= 5) riskInsight = `最大回撤${r.maxDrawdown.toFixed(1)}%，风险控制极为优秀。`
  else if (r.maxDrawdown <= 10) riskInsight = `最大回撤${r.maxDrawdown.toFixed(1)}%，属正常波动范围，风险可控。`
  else if (r.maxDrawdown <= 20) riskInsight = `最大回撤${r.maxDrawdown.toFixed(1)}%，波动较大，投资者需承受一定风险。`
  else riskInsight = `最大回撤高达${r.maxDrawdown.toFixed(1)}%，风险敞口显著，应重点关注。`

  // 夏普比率分析
  let sharpeInsight = ''
  if (r.sharpe >= 2) sharpeInsight = `夏普比率${r.sharpe.toFixed(2)}，风险调整后收益极佳，是专业机构首选评价指标。`
  else if (r.sharpe >= 1.5) sharpeInsight = `夏普比率${r.sharpe.toFixed(2)}，风险收益效率优秀，远超市场基准。`
  else if (r.sharpe >= 1) sharpeInsight = `夏普比率${r.sharpe.toFixed(2)}，性价比较好，每承担一单位风险获得相应超额回报。`
  else if (r.sharpe >= 0.5) sharpeInsight = `夏普比率${r.sharpe.toFixed(2)}，风险收益效率一般。`
  else sharpeInsight = `夏普比率${r.sharpe.toFixed(2)}，风险调整后收益欠佳。`

  // 策略分类洞察
  let categoryInsight = ''
  const cat = r.navCategory || ''
  if (cat.includes('量化') || (r.tags && r.tags.includes('量化'))) {
    categoryInsight = '量化驱动策略，纪律性强，模型可持续迭代，风格稳健。'
  } else if (cat.includes('固收') || cat.includes('债券')) {
    categoryInsight = '固定收益类策略，债券票息为收益基础，信用风险和利率风险是主要矛盾。'
  } else if (cat.includes('权益') || cat.includes('股票')) {
    categoryInsight = '权益类策略，收益与市场系统性风险高度相关，选股和择时能力是超额来源。'
  } else if (cat.includes('商品') || cat.includes('黄金')) {
    categoryInsight = '大宗商品或贵金属策略，与股债相关性低，是资产配置中的避险工具。'
  } else {
    categoryInsight = `策略定位于${cat}，收益来源多元，风格偏${r.riskLevel >= 'R4' ? '积极' : '稳健'}。`
  }

  // 驱动因素
  let driverInsight = ''
  if ((r.tags || []).some((t: string) => t.includes('对冲'))) {
    driverInsight = '对冲机制有效抵消市场系统性风险，Alpha来源以选股超额为主。'
  } else if ((r.tags || []).some((t: string) => t.includes('指数') || t.includes('被动'))) {
    driverInsight = '被动跟踪基准指数，管理费低，收益主要来自指数Beta而非主动管理。'
  } else if ((r.tags || []).some((t: string) => t.includes('CTA') || t.includes('趋势'))) {
    driverInsight = 'CTA趋势跟踪策略，商品期货驱动，顺势而为，波动市表现突出。'
  } else {
    driverInsight = `${r.logicSummary || '策略逻辑以主动管理为核心'}，超额收益依赖于管理人的研究和执行效率。`
  }

  // 配置价值
  let configInsight = ''
  const periodLabel = period === '近一年' || period === '成立以来' ? '12个月' : period === '近一季' ? '3个月' : period === '近一月' ? '1个月' : period
  if (r.sharpe >= 1.5 && r.maxDrawdown <= 10) {
    configInsight = `综合评价优秀，建议核心持仓配置比例30-50%，持有期限${periodLabel}以上，每年定期评估策略有效性。`
  } else if (r.sharpe >= 1 && r.maxDrawdown <= 15) {
    configInsight = `综合评价良好，建议卫星持仓配置比例15-25%，持有期限6个月以上，关注策略容量变化。`
  } else if (r.maxDrawdown > 20 || r.annualReturn < 0) {
    configInsight = `综合评价一般，建议低配或回避（配置比例不超过10%），当前市场环境对策略不利。`
  } else {
    configInsight = `综合评价中等，建议标配或低配（10-15%），分散风险为主，不宜重仓。`
  }

  const marketInsight = `${returnInsight} ${winInsight} ${categoryInsight}`
  const strategyDriver = `${driverInsight} ${sharpeInsight} ${riskInsight}`
  const riskRewardAnalysis = `${sharpeInsight} ${riskInsight} ${winInsight}。从风险收益比看，该策略属于${r.sharpe >= 1.5 ? '高性价比' : r.sharpe >= 1 ? '中等性价比' : '低性价比'}组合。`
  const summary = `${r.name}为光大资管${cat}策略，近${period}收益${periodReturn >= 0 ? '+' : ''}${periodReturn.toFixed(2)}%，年化${r.annualReturn >= 0 ? '+' : ''}${r.annualReturn.toFixed(1)}%。胜率${r.winRate?.toFixed(0) || '—'}%，最大回撤-${r.maxDrawdown.toFixed(1)}%，夏普${r.sharpe.toFixed(2)}。整体表现${r.sharpe >= 1.5 ? '优秀，值得重点配置' : r.sharpe >= 1 ? '良好，可作为组合卫星配置' : '一般，建议谨慎评估后配置'}。`

  return {
    strategyName: r.name,
    period,
    periodReturn,
    annualReturn: r.annualReturn,
    maxDrawdown: r.maxDrawdown,
    winRate: r.winRate,
    volatility: r.volatility,
    sharpe: r.sharpe,
    riskLevel: riskText,
    marketInsight: marketInsight.trim(),
    strategyDriver: strategyDriver.trim(),
    riskRewardAnalysis: riskRewardAnalysis.trim(),
    configValue: configInsight.trim(),
    summary: summary.trim(),
    riskWarning: '历史业绩不代表未来表现。策略过往业绩优异不代表未来持续盈利，请结合自身风险承受能力判断。投资有风险，入市需谨慎。',
  }
}

// POST /api/attribution/ai — AI 归因分析（Node 原生 fetch，更稳定）
router.post('/api/attribution/ai', async (req, res) => {
  const requestId = res.locals.requestId
  req.setTimeout?.(0)

  try {
    const { strategy, period = '近一月', periodReturn } = req.body as {
      strategy: {
        name: string
        navCategory: string
        annualReturn: number
        winRate: number
        maxDrawdown: number
        volatility: number
        sharpe: number
        riskLevel: string
        investmentHorizon?: string
        logicSummary?: string
        tags?: string[]
      }
      period?: string
      periodReturn?: number
    }

    if (!strategy?.name) {
      res.status(400).json(errorResponse('strategy 对象不能为空', requestId))
      return
    }

    const r = strategy
    const pr = periodReturn ?? r.annualReturn
    const volatilityValue = r.volatilityValue ?? (typeof r.volatility === 'number' ? r.volatility : 0)
    const riskMap: Record<string, string> = {
      R1: '低风险', R2: '中低风险', R3: '中等风险', R4: '中高风险', R5: '高风险'
    }
    const riskText = riskMap[r.riskLevel] || r.riskLevel || '中等风险'

    const prompt = `你是一名资深基金策略归因分析专家。请对以下策略在${period}期间的表现进行深度归因分析，必须基于给出的具体数据给出有洞察的分析，不要泛泛而谈。返回结构化 JSON。

【策略详细信息】
- 策略名称：${r.name}
- 资产类别：${r.navCategory}
- 风险等级：${riskText}
- 投资期限：${r.investmentHorizon || '中期'}
- 近${period}收益：${pr >= 0 ? '+' : ''}${pr.toFixed(2)}%
- 年化收益率：${r.annualReturn >= 0 ? '+' : ''}${r.annualReturn.toFixed(2)}%
- 胜率：${r.winRate != null ? r.winRate.toFixed(0) + '%' : '—'}
- 最大回撤：${r.maxDrawdown != null ? '-' + r.maxDrawdown.toFixed(2) + '%' : '—'}
- 波动率：${volatilityValue > 0 ? volatilityValue.toFixed(2) + '%' : '—'}
- 夏普比率：${r.sharpe != null ? r.sharpe.toFixed(2) : '—'}
- 核心策略逻辑：${r.logicSummary || '暂无说明'}
- 策略标签：${(r.tags || []).join('、')}

返回纯 JSON：
{"marketInsight":"...","strategyDriver":"...","riskRewardAnalysis":"...","configValue":"...","summary":"...","riskWarning":"..."}`

    const url = process.env.MODEL_API_URL || 'https://zxcode.vip'
    const key = process.env.MODEL_API_KEY
    const model = process.env.MODEL_NAME || 'gpt-5.4'

    if (!key) {
      res.status(500).json(errorResponse('MODEL_API_KEY not configured', requestId))
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180_000) // 3分钟

    try {
      const response = await fetch(`${url}/v1/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          input: prompt,
          max_tokens: 2000
        }),
        signal: controller.signal as any
      } as any)
      clearTimeout(timeout)

      if (!response.ok) {
        const text = await response.text()
        res.status(502).json(errorResponse(`AI API error: ${response.status} ${text.slice(0, 200)}`, requestId))
        return
      }

      const json = await response.json() as any
      // 解析 Responses API 输出格式
      let raw = ''
      if (json.output && Array.isArray(json.output)) {
        const msg = json.output.find((b: any) => b.type === 'message')
        if (msg?.content) {
          const textBlock = msg.content.find((b: any) => b.type === 'output_text' || b.type === 'text')
          raw = textBlock?.text || ''
        }
      }

      if (!raw) {
        raw = JSON.stringify(json)
      }

      // 解析 JSON
      let parsed: any = {}
      try {
        const jsonMatch =
          raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
          raw.match(/```\s*([\s\S]*?)\s*```/) ||
          raw.match(/^\s*(\{[\s\S]*\})\s*$/)
        const jsonStr = jsonMatch ? jsonMatch[1] : raw
        parsed = JSON.parse(jsonStr.trim())
      } catch {
        res.status(500).json(errorResponse('AI 返回格式异常，请重试', requestId))
        return
      }

      const data = {
        strategyName: r.name,
        period,
        periodReturn: pr,
        annualReturn: r.annualReturn,
        maxDrawdown: r.maxDrawdown,
        winRate: r.winRate,
        volatility: volatilityValue,
        sharpe: r.sharpe,
        riskLevel: riskText,
        ...parsed,
      }
      res.json(successResponse(data, requestId))

    } catch (err: any) {
      clearTimeout(timeout)
      if (err.name === 'AbortError' || err.message.includes('aborted')) {
        res.status(504).json(errorResponse('AI 分析超时（3分钟），请重试或使用规则归因', requestId))
        return
      }
      res.status(500).json(errorResponse('AI 分析失败：' + err.message, requestId))
    }

  } catch (err: any) {
    console.error(`[${requestId}] attribution/ai error:`, err.message)
    res.status(500).json(errorResponse('归因分析失败：' + (err.message || '未知错误'), requestId))
  }
})

// POST /api/attribution — 归因分析（纯规则引擎，无需 AI）
router.post('/api/attribution', (req, res) => {
  const requestId = res.locals.requestId

  try {
    const { strategy, period = '近一月', periodReturn } = req.body as {
      strategy: {
        name: string
        navCategory: string
        annualReturn: number
        winRate: number
        maxDrawdown: number
        volatility: number
        sharpe: number
        riskLevel: string
        investmentHorizon?: string
        logicSummary?: string
        tags?: string[]
      }
      period?: string
      periodReturn?: number
    }

    if (!strategy?.name) {
      res.status(400).json(errorResponse('strategy 对象不能为空', requestId))
      return
    }

    const attribution = generateAttribution(strategy, period, periodReturn ?? strategy.annualReturn)
    res.json(successResponse(attribution, requestId))

  } catch (err: any) {
    console.error(`[${requestId}] attribution error:`, err.message)
    res.status(500).json(errorResponse('归因分析失败：' + (err.message || '未知错误'), requestId))
  }
})

export default router
