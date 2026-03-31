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

    // 构建归因分析 prompt — 返回结构化 JSON，数据驱动有深度的分析
    const prompt = `
你是一名资深基金策略归因分析专家。请对以下策略在${period}期间的表现进行深度归因分析，**必须基于给出的具体数据给出有洞察的分析**，不要泛泛而谈。返回结构化 JSON。

【策略详细信息】
- 策略名称：${r.name}
- 资产类别：${r.navCategory}
- 风险等级：${riskText}
- 投资期限：${r.investmentHorizon}
- 近${period}收益：${pr >= 0 ? '+' : ''}${pr.toFixed(2)}%
- 年化收益率：${r.annualReturn >= 0 ? '+' : ''}${r.annualReturn.toFixed(2)}%
- 胜率（正收益月份占比）：${r.winRate?.toFixed(0) ?? '—'}%
- 最大回撤（历史最大跌幅）：${r.maxDrawdown != null ? '-' + r.maxDrawdown.toFixed(2) + '%' : '—'}
- 波动率：${r.volatility != null ? r.volatility.toFixed(2) + '%' : '—'}
- 夏普比率：${r.sharpe != null ? r.sharpe.toFixed(2) : '—'}
- 核心策略逻辑：${r.logicSummary || '暂无说明'}
- 策略标签：${(r.tags || []).join('、')}

【分析要求 — 每项必须结合上述具体数据】

1. **市场环境归因**：该策略在近${period}（收益率${pr >= 0 ? '+' : ''}${pr.toFixed(2)}%）与其所属资产类别（${r.navCategory}）的历史规律是否匹配？哪些市场因素驱动了收益或回撤？给出具体分析，不要只说"表现良好"。

2. **策略驱动因素**：结合胜率${r.winRate?.toFixed(0) ?? '—'}%、最大回撤${r.maxDrawdown != null ? r.maxDrawdown.toFixed(2) : '—'}%、波动率${r.volatility != null ? r.volatility.toFixed(2) : '—'}%，判断该策略的核心收益来源是什么（选股？择时？杠杆？衍生品？），哪个指标最能解释其表现？

3. **风险收益质量评估**：夏普比率${r.sharpe != null ? r.sharpe.toFixed(2) : '—'}（通常>1为优秀，<0.5为较差）说明什么？胜率高（${r.winRate?.toFixed(0) ?? '—'}%）是否代表收益稳定？最大回撤${r.maxDrawdown != null ? r.maxDrawdown.toFixed(2) : '—'}%在同类策略中属于什么水平？

4. **配置价值与具体建议**：该策略适合哪类投资者？作为组合底仓还是卫星配置？在当前市场环境下（结合近${period}收益）是否值得配置？持有建议（月份）和需要重点关注的指标是什么？

【输出格式】
只返回纯 JSON，不要 markdown 代码块，不要任何其他文字：
{
  "marketInsight": "必须结合${r.navCategory}类别特征和近${period}收益数据，分析2-3个具体市场因素",
  "strategyDriver": "必须引用胜率/回撤/波动率具体数字，说明2-3个核心驱动因素",
  "riskRewardAnalysis": "必须引用夏普比率和最大回撤具体数字，给出2-3句质量评价",
  "configValue": "必须给出具体配置比例建议（百分比范围）和持有期限建议",
  "summary": "一句话结论，要具体，引用核心数字，不能空洞",
  "riskWarning": "一句话具体风险提示，说明最大亏损场景"
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
