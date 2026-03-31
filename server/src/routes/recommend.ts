import { Router } from 'express'
import { aiService } from '../services/ai-service'
import { successResponse, errorResponse } from '../utils/response'

const router = Router()

function generateTemplateNarrative(strategies: any[], returnTarget: string, riskLevel: string): string {
  if (!strategies?.length) return '暂无策略信息'
  const s = strategies[0]
  const returnMap: Record<string, string> = {
    stable: '5%以下', moderate: '5%-10%', aggressive: '10%以上'
  }
  const riskMap: Record<string, string> = {
    R1: '保守型', R2: '稳健型', R3: '平衡型', R4: '积极型', R5: '激进型'
  }
  const riskText = riskMap[riskLevel] || riskLevel || '平衡型'
  const returnText = returnMap[returnTarget] || returnTarget || '5%-10%'
  const retSign = s.annualReturn >= 0 ? '+' : ''
  const maxLoss = Math.round((s.maxDrawdown || 0) * 10) / 10

  return `【光大资管 · 策略配置建议书】

一、首选策略推荐

${s.name}

光大资管旗下 ${s.navCategory} 策略，近一年年化收益率达 ${retSign}${s.annualReturn?.toFixed(2)}%，区间胜率 ${s.winRate?.toFixed(0)}%，夏普比率 ${s.sharpe || '—'}。该策略以 ${s.logicSummary || '多元策略框架'}(${(s.tags || []).join('、')})为核心，在过去一年波动市场中展现出良好的风险调整收益特征。

二、核心推荐逻辑

• 收益能力：年化 ${retSign}${s.annualReturn?.toFixed(2)}%，显著跑赢同类型策略基准，在当前 ${returnText} 的收益目标下具有竞争力。

• 风险控制：历史最大回撤 ${maxLoss}%，夏普比率 ${s.sharpe || '—'}（>1为优秀），风险调整后收益质量良好。

• 策略适配：适合风险偏好为${riskText}的投资者，与您的收益目标（${returnText}）高度匹配。

三、备选策略说明

${strategies.length > 1 ? strategies.slice(1).map((alt: any, i: number) =>
  `备选${i + 1} ${alt.name}：年化${alt.annualReturn >= 0 ? '+' : ''}${alt.annualReturn?.toFixed(2)}%，回撤${(alt.maxDrawdown || 0).toFixed(1)}%。`
).join('\n\n') : '暂无其他备选策略。'}

四、风险揭示

历史业绩不代表未来表现。上述策略在极端市场情景下，最大回撤历史记录为${maxLoss}%，意味着投资100万元在最坏情况下可能浮亏约${maxLoss}万元。请投资者充分了解产品风险，审慎做出投资决策。

五、配置建议

建议首期配置比例20%-40%，持有期限6个月以上。重点关注净值波动率和最大回撤两项风控指标，若回撤超过历史均值1.5倍，建议及时与顾问沟通调整。
`
}

// POST /api/recommend-narrative — 流式生成推荐解读
router.post('/api/recommend-narrative', async (req, res) => {
  const requestId = res.locals.requestId

  try {
    const { strategies, returnTarget, riskLevel } = req.body as {
      strategies: any[]
      returnTarget?: string
      riskLevel?: string
    }

    if (!strategies?.length) {
      res.status(400).send(JSON.stringify(errorResponse('strategies 不能为空', requestId)))
      return
    }

    const s = strategies[0]
    const prompt = `
你是光大资管的高级投资顾问。请根据以下策略信息，为客户生成一段详尽、专业、有洞察力的推荐解读。

【首选策略信息】
- 策略名称：${s.name}
- 资产类别：${s.navCategory}
- 年化收益率：${s.annualReturn >= 0 ? '+' : ''}${s.annualReturn?.toFixed(2)}%
- 胜率：${s.winRate?.toFixed(0)}%
- 最大回撤：-${(s.maxDrawdown || 0).toFixed(2)}%
- 夏普比率：${s.sharpe || '—'}
- 波动率：${(s.volatility || 0).toFixed(2)}%
- 风险等级：${s.riskLevel || 'R3'}
- 投资逻辑：${s.logicSummary || '暂无'}
- 策略标签：${(s.tags || []).join('、')}
- 策略管理人：${s.owner || '光大资管'}

【客户画像】
- 收益目标：${returnTarget || 'moderate'}
- 风险偏好：${riskLevel || 'R3'}

【生成要求】
生成一段600-800字的推荐解读，必须包含：
1. 首选策略的核心推荐理由（结合收益、风险、流动性综合评价，引用具体数字）
2. 备选策略的主要差异和取舍（如有）
3. 明确的风险提示（历史收益不代表未来）
4. 适配人群和不适合人群
5. 具体配置比例建议和持有建议

语言专业但通俗易懂，分段清晰，每段3-5句话。不要过度营销，不要承诺收益，不要使用绝对化用语。

直接输出解读正文，不要使用markdown格式，不要加标题前缀。
`

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Transfer-Encoding', 'chunked')

    try {
      const text = await aiService.generateText(prompt)
      res.write(text)
      res.end()
    } catch (aiErr: any) {
      // AI 调用失败时，用高质量模板替代
      const fallback = generateTemplateNarrative(strategies, returnTarget || '', riskLevel || '')
      res.write(fallback)
      res.end()
    }

  } catch (err: any) {
    console.error(`[${requestId}] recommend-narrative error:`, err.message)
    const msg = '推荐解读生成失败：' + (err.message || '未知错误')
    res.status(500).send(JSON.stringify(errorResponse(msg, requestId)))
  }
})

export default router
