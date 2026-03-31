import { Router } from 'express'
import { aiService } from '../services/ai-service'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

// POST /api/attribution — 归因分析：解释策略在特定时间段内的表现驱动因素
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
      return res.status(400).json(errorResponse('strategy 对象不能为空', requestId))
    }

    const r = strategy
    const pr = periodReturn ?? r.annualReturn

    // 风险等级文字映射
    const riskMap: Record<string, string> = {
      R1: '低风险', R2: '中低风险', R3: '中等风险', R4: '中高风险', R5: '高风险'
    }
    const riskText = riskMap[r.riskLevel] || r.riskLevel || '中等风险'

    // 构建归因分析 prompt — 返回结构化 JSON
    const prompt = `
你是一名基金策略归因分析专家。请对以下策略在${period}期间的表现进行深度归因分析，返回结构化 JSON。

【策略基本信息】
- 名称：${r.name}
- 分类：${r.navCategory}
- 风险等级：${riskText}
- 适用期限：${r.investmentHorizon}
- 期间收益率：${pr >= 0 ? '+' : ''}${pr.toFixed(2)}%
- 年化收益率：${r.annualReturn >= 0 ? '+' : ''}${r.annualReturn.toFixed(2)}%
- 胜率：${r.winRate?.toFixed(0) ?? '—'}%
- 最大回撤：${r.maxDrawdown != null ? '-' + r.maxDrawdown.toFixed(2) + '%' : '—'}
- 波动率：${r.volatility != null ? r.volatility.toFixed(2) + '%' : '—'}
- 夏普比率：${r.sharpe != null ? r.sharpe.toFixed(2) : '—'}
- 策略逻辑：${r.logicSummary || '暂无说明'}
- 策略标签：${(r.tags || []).join('、')}

【输出格式要求】
请返回以下 JSON 结构（不要包含任何 markdown 格式，只输出纯 JSON）：
{
  "marketInsight": "市场环境因素的归因分析，2-3句话，专业但通俗",
  "strategyDriver": "策略特性归因，2-3句话，说明核心驱动因素",
  "riskRewardAnalysis": "风险收益特征解读，2-3句话，评价收益质量",
  "configValue": "配置价值与风险提示，3-4句话，给出具体持有建议",
  "summary": "一句话总结（供领导层快速了解）",
  "riskWarning": "一句简短的风险提示语"
}
`

    let raw = await aiService.generateText(prompt)
    // 尝试从 markdown 代码块中提取 JSON
    let parsed: any = {}
    try {
      const jsonMatch =
        raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
        raw.match(/```\s*([\s\S]*?)\s*```/) ||
        raw.match(/^\s*(\{[\s\S]*\})\s*$/)
      const jsonStr = jsonMatch ? jsonMatch[1] : raw
      parsed = JSON.parse(jsonStr.trim())
    } catch {
      // AI 返回内容无法解析为 JSON，降级返回原始文本
      return res.json(successResponse({
        strategyName: r.name,
        period,
        periodReturn: pr,
        annualReturn: r.annualReturn,
        maxDrawdown: r.maxDrawdown,
        winRate: r.winRate,
        volatility: r.volatility,
        sharpe: r.sharpe,
        riskLevel: riskText,
        analysis: raw.trim(),
        summary: '（AI 返回格式异常，请重试）',
        riskWarning: '以上内容仅供参考，不构成投资建议',
      }, requestId))
    }

    return res.json(successResponse({
      strategyName: r.name,
      period,
      periodReturn: pr,
      annualReturn: r.annualReturn,
      maxDrawdown: r.maxDrawdown,
      winRate: r.winRate,
      volatility: r.volatility,
      sharpe: r.sharpe,
      riskLevel: riskText,
      ...parsed,
    }, requestId))

  } catch (err: any) {
    console.error(`[${requestId}] attribution error:`, err)
    if (err.message.includes('MODEL_API_URL or MODEL_API_KEY is missing')) {
      return res.status(503).json(errorResponse('AI 服务未配置，请联系管理员配置 MODEL_API_KEY', requestId))
    }
    return res.status(500).json(errorResponse('归因分析失败：' + (err.message || '未知错误'), requestId))
  }
})

export default router
