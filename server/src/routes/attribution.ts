import { Router } from 'express'
import { aiService } from '../services/ai-service'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

// 测试端点
router.get('/api/attribution/test', (_req, res) => {
  res.json(successResponse({ test: 'ok', message: 'attribution route is loaded' }))
})

// 快速 AI 测试端点（不过 AI，返回假数据）
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

// POST /api/attribution — 归因分析
router.post('/api/attribution', async (req, res) => {
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
        investmentHorizon: string
        logicSummary: string
        tags: string[]
      }
      period?: string
      periodReturn?: number
    }

    if (!strategy?.name) {
      res.status(400).send(JSON.stringify(errorResponse('strategy 对象不能为空', requestId)))
      return
    }

    const r = strategy
    const pr = periodReturn ?? r.annualReturn
    const volatilityValue = r.volatilityValue ?? (typeof r.volatility === 'number' ? r.volatility : 0)

    const riskMap: Record<string, string> = {
      R1: '低风险', R2: '中低风险', R3: '中等风险', R4: '中高风险', R5: '高风险'
    }
    const riskText = riskMap[r.riskLevel] || r.riskLevel || '中等风险'

    const prompt = `
你是一名资深基金策略归因分析专家。请对以下策略在${period}期间的表现进行深度归因分析，**必须基于给出的具体数据给出有洞察的分析**，不要泛泛而谈。返回结构化 JSON。

【策略详细信息】
- 策略名称：${r.name}
- 资产类别：${r.navCategory}
- 风险等级：${riskText}
- 投资期限：${r.investmentHorizon || '中期'}
- 近${period}收益：${pr >= 0 ? '+' : ''}${pr.toFixed(2)}%
- 年化收益率：${r.annualReturn >= 0 ? '+' : ''}${r.annualReturn.toFixed(2)}%
- 胜率（正收益月份占比）：${r.winRate != null ? r.winRate.toFixed(0) + '%' : '—'}
- 最大回撤（历史最大跌幅）：${r.maxDrawdown != null ? '-' + r.maxDrawdown.toFixed(2) + '%' : '—'}
- 波动率：${volatilityValue > 0 ? volatilityValue.toFixed(2) + '%' : '—'}
- 夏普比率：${r.sharpe != null ? r.sharpe.toFixed(2) : '—'}
- 核心策略逻辑：${r.logicSummary || '暂无说明'}
- 策略标签：${(r.tags || []).join('、')}

【输出格式】
只返回纯 JSON，不要 markdown 代码块，不要任何其他文字：
{
  "marketInsight": "...",
  "strategyDriver": "...",
  "riskRewardAnalysis": "...",
  "configValue": "...",
  "summary": "...",
  "riskWarning": "..."
}
`

    let raw = ''
    try {
      raw = await aiService.generateText(prompt)
    } catch (aiErr: any) {
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
        analysis: aiErr.message?.includes('超时') ? '（AI 分析暂时不可用，请稍后重试）' : '（归因分析暂时不可用）',
        summary: '（AI 服务暂时不可用）',
        riskWarning: '以上内容仅供参考，不构成投资建议',
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.send(JSON.stringify(successResponse(data, requestId)))
      return
    }

    let parsed: any = {}
    try {
      const jsonMatch =
        raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
        raw.match(/```\s*([\s\S]*?)\s*```/) ||
        raw.match(/^\s*(\{[\s\S]*\})\s*$/)
      const jsonStr = jsonMatch ? jsonMatch[1] : raw
      parsed = JSON.parse(jsonStr.trim())
    } catch {
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
        analysis: raw.trim(),
        summary: '（AI 返回格式异常，请重试）',
        riskWarning: '以上内容仅供参考，不构成投资建议',
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.send(JSON.stringify(successResponse(data, requestId)))
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
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.send(JSON.stringify(successResponse(data, requestId)))

  } catch (err: any) {
    console.error(`[${requestId}] attribution error:`, err.message)
    const msg = err.message?.includes('timeout') || err.message?.includes('超时')
      ? '归因分析超时，请重试（AI 服务响应较慢，请耐心等待）'
      : '归因分析失败：' + (err.message || '未知错误')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(500).send(JSON.stringify(errorResponse(msg, requestId)))
  }
})

export default router
