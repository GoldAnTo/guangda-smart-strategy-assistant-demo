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

    // 构建归因分析 prompt
    const prompt = `
你是一名基金策略归因分析专家。请对以下策略在${period}期间的表现进行深度归因分析。

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

【分析要求】
请从以下四个维度进行归因分析，每个维度给出 2-3 句专业、通俗的解释：

1. **市场环境因素**：该策略在${period}期间的表现与整体市场环境的关系（牛市/熊市/震荡市下各类型策略的典型表现）

2. **策略特性归因**：结合策略的风险等级、资产定位、投资逻辑，分析该策略表现的驱动因素是什么（例如：股票多头策略受A股走势驱动；债券增强受利率环境影响；量化策略受市场波动率影响等）

3. **风险收益特征解读**：结合胜率、最大回撤、夏普比率，评价该策略的风险调整后收益质量。重点说明：回撤主要发生在什么情境下？胜率高是否代表收益稳定？

4. **配置价值与风险提示**：该策略在投资组合中的价值是什么？适合什么样的投资者？需要注意哪些风险？给出具体的持有建议（持有期限、关注指标等）

【输出格式】
请直接输出分析文字，不要使用 Markdown 格式，用自然段落形式表达。语言专业但不晦涩，让非专业投资者也能理解。
`

    const analysis = await aiService.generateText(prompt)

    return res.json(successResponse({
      strategyName: r.name,
      period,
      periodReturn: pr,
      analysis,
    }, requestId))

  } catch (err: any) {
    console.error(`[${requestId}] attribution error:`, err)
    if (err.message.includes('MODEL_API_URL or MODEL_API_KEY is missing')) {
      return res.status(503).json(errorResponse('AI 服务未配置，请联系管理员配置 MODEL_API_KEY', requestId))
    }
    return res.status(500).json(errorResponse('归因分析失败：' + err.message, requestId))
  }
})

export default router
