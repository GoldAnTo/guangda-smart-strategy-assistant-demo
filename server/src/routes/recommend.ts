import { Router } from 'express'
import { recommendService, type CustomerProfile } from '../services/recommend-service'
import { aiService } from '../services/ai-service'
import { successResponse, errorResponse } from '../utils/response'

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null || isNaN(v)) return '—'
  return (v >= 0 ? '+' : '') + v.toFixed(decimals)
}

const router = Router()

router.post('/api/recommend', (req, res) => {
  const requestId = res.locals.requestId
  try {
    const profile = req.body as CustomerProfile
    if (!profile.riskLevel || !profile.investmentHorizon || !profile.liquidityNeed || !profile.returnExpectation) {
      return res.status(400).json(errorResponse(
        '缺少必要字段，需要: riskLevel, investmentHorizon, liquidityNeed, returnExpectation',
        requestId
      ))
    }
    const result = recommendService.recommend(profile)
    return res.json(successResponse(result, requestId))
  } catch (err: any) {
    console.error(`[${requestId}] recommend error:`, err)
    return res.status(500).json(errorResponse('推荐服务异常', requestId))
  }
})

// POST /api/recommend-narrative — 规则引擎生成结构化专业Narrative
// POST /api/recommend-narrative — AI 生成结构化专业分析Narrative
router.post('/api/recommend-narrative', async (req, res) => {
  const requestId = res.locals.requestId
  try {
    const { strategies, profile } = req.body as { strategies: any[]; profile?: any }
    if (!strategies || strategies.length === 0) {
      return res.status(400).json(errorResponse('strategies数组不能为空', requestId))
    }

    const top = strategies[0]
    const rest = strategies.slice(1, 4)

    const riskLevelMap: Record<string, string> = {
      R1: '低风险', R2: '中低风险', R3: '中等风险', R4: '中高风险', R5: '高风险'
    }
    const horizonMap: Record<string, string> = {
      short_term: '短期（半年内）',
      medium_term: '中期（半年至两年）',
      long_term: '长期（两年以上）'
    }
    const fmtPct = (v: any) => {
      const num = typeof v === 'number' ? v : parseFloat(v)
      if (num == null || isNaN(num)) return '—'
      return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
    }
    const safeStr = (v: any) => v != null ? String(v) : ''
    const safeList = (arr: any) => Array.isArray(arr) ? arr.filter(Boolean).map(String) : []

    // 构建 AI prompt
    const prompt = `
你是光大资管的AI投资顾问。请根据以下策略数据，为客户生成一段专业的策略推荐解读。

【首选策略】
- 名称：${safeStr(top.name)}
- 分类：${safeStr(top.navCategory)}
- 管理者：${safeStr(top.owner) || '光大资管'}
- 风险等级：${riskLevelMap[top.riskLevel] || safeStr(top.riskLevel) || '中等风险'}
- 投资期限：${horizonMap[top.investmentHorizon] || safeStr(top.investmentHorizon) || '中期'}
- 年化收益率：${fmtPct(top.annualReturn)}
- 胜率：${fmtPct(top.winRate)}
- 最大回撤：${fmtPct(top.maxDrawdown)}
- 夏普比率：${top.sharpe != null ? top.sharpe.toFixed(2) : '—'}
- 波动率：${fmtPct(top.volatility)}
- 基准：${safeStr(top.benchmarkName)}
- 策略逻辑：${safeStr(top.logicSummary) || '暂无说明'}
- 标签：${safeList(top.tags).slice(0, 5).join('、')}
- 匹配原因：${safeList(top.matchReasons).slice(0, 3).join('；') || '暂无'}
- 适合人群：${safeList(top.suitableFor).slice(0, 3).join('、') || '未标注'}
- 不适合人群：${safeList(top.notSuitableFor).slice(0, 2).join('、') || '未标注'}

${rest.length > 0 ? `【备选策略】\n${rest.map((s: any, i: number) =>
      `${i + 2}. ${safeStr(s.name)}（${fmtPct(s.annualReturn)}，${riskLevelMap[s.riskLevel] || safeStr(s.riskLevel) || '中等风险'}，回撤${fmtPct(s.maxDrawdown)}）`
    ).join('\n')}` : '【备选策略】暂无'}

请生成一段专业的推荐解读，包含：
1. 首选策略的核心推荐理由（收益/风险/适配性）
2. 与备选策略的主要差异和取舍
3. 明确的风险提示（历史收益不代表未来）
4. 适配人群和不适合人群

要求：语言专业但通俗，分段清晰，每段2-3句话。不要过度营销，不要承诺收益。整体300字以内。
`.trim()

    const narrative = await aiService.generateText(prompt)

    return res.json(successResponse({ narrative }, requestId))

  } catch (err: any) {
    console.error(`[${requestId}] recommend-narrative error:`, err)
    if (err.message.includes('MODEL_API_URL or MODEL_API_KEY is missing')) {
      return res.status(503).json(errorResponse('AI 服务未配置，请联系管理员', requestId))
    }
    return res.status(500).json(errorResponse('Narrative 生成失败：' + err.message, requestId))
  }
})

// POST /api/portfolio-narrative — 规则引擎生成组合解读Narrative
router.post('/api/portfolio-narrative', (req, res) => {
  const requestId = res.locals.requestId
  try {
    const { components, portfolioReturn, portfolioVolatility, portfolioMaxDrawdown, portfolioSharpe } = req.body as any
    if (!components || !Array.isArray(components)) {
      return res.status(400).json(errorResponse('components数组不能为空', requestId))
    }

    const rtn = portfolioReturn ?? 0
    const vol = portfolioVolatility ?? 0
    const maxDD = portfolioMaxDrawdown ?? 0
    const shp = portfolioSharpe ?? 0
    const count = components.length

    // 风险评价
    let riskLevel = '中等'
    if (vol >= 15) riskLevel = '高'
    else if (vol >= 8) riskLevel = '中高'
    else if (vol >= 3) riskLevel = '中等'
    else riskLevel = '低'

    // 收益评价
    let returnComment = ''
    if (rtn >= 15) returnComment = '组合年化收益超过15%，进攻性突出'
    else if (rtn >= 8) returnComment = '组合年化收益处于合理区间，具备稳健的收益获取能力'
    else if (rtn >= 0) returnComment = '组合收益相对平稳，建议关注市场整体环境'
    else returnComment = '组合当前收益为负，市场环境对组合形成压力'

    // 分散化评价
    let divComment = ''
    if (count >= 3) {
      divComment = '组合涵盖' + count + '条策略，通过跨策略分散有效降低单一策略风险'
    } else if (count === 2) {
      divComment = '2条策略的组合提供了基础的分散化效果，建议可适当增加策略数量'
    } else {
      divComment = '单一策略集中度高，建议增加其他策略以分散风险'
    }

    // 回撤评价
    let ddComment = ''
    if (maxDD >= 20) ddComment = '最大回撤超过20%，组合波动较大，在极端市场下可能承受显著损失'
    else if (maxDD >= 10) ddComment = '最大回撤处于' + maxDD.toFixed(1) + '%，需要客户对短期波动有较强承受能力'
    else if (maxDD >= 5) ddComment = '最大回撤控制在' + maxDD.toFixed(1) + '%以内，组合风险相对可控'
    else ddComment = '最大回撤仅为' + maxDD.toFixed(1) + '%，组合风险控制极为出色'

    // 夏普评价
    let sharpeComment = ''
    if (shp >= 2.0) sharpeComment = '夏普比率达' + shp.toFixed(2) + '，风险调整后收益极为优异，是顶级的风险收益特征'
    else if (shp >= 1.5) sharpeComment = '夏普比率' + shp.toFixed(2) + '，处于行业优秀水平，风险收益效率高'
    else if (shp >= 1.0) sharpeComment = '夏普比率' + shp.toFixed(2) + '，优于市场平均水平，具备持续获取超额收益的能力'
    else if (shp >= 0) sharpeComment = '夏普比率' + shp.toFixed(2) + '偏低，说明风险收益效率有待提升'
    else sharpeComment = '夏普比率为负，反映当前市场环境对组合不利'

    // 各策略摘要
    const stratList = components.map((c: any, i: number) => {
      const name = c.name || '策略' + (i + 1)
      const w = c.weight || 0
      const r = c.annualReturn ?? 0
      const v = c.volatility ?? 0
      const d = c.maxDrawdown ?? 0
      return name + '（权重' + w.toFixed(0) + '%，年化' + fmt(r) + '%，波动率' + fmt(v, 2, false) + '%）'
    }).join('；')

    const narrative =
      '【组合整体评价】\n\n' +
      '该策略组合模拟表现为：年化收益' + fmt(rtn) + '%，波动率' + fmt(vol, 2, false) + '%，最大回撤' + fmt(maxDD, 2, false) + '%，夏普比率' + fmt(shp, 2, false) + '。' + returnComment + '。' + ddComment + '。' + sharpeComment + '。\n\n' +
      '【分散化效果】\n\n' + divComment + '。组合内各策略分别为：' + stratList + '。\n\n' +
      '【配置建议】\n\n' +
      '建议持有期限不低于' + (vol >= 10 ? '6个月' : vol >= 5 ? '3个月' : '1个月') + '，以平滑市场短期波动对持有体验的影响。' +
      '组合波动率' + (vol >= 10 ? '较高' : vol >= 5 ? '适中' : '较低') + '，适合' + (vol >= 10 ? '风险偏好进取型客户' : vol >= 5 ? '风险偏好平衡型客户' : '风险偏好稳健型客户') + '。' +
      '历史数据模拟结果仅供参考，不构成收益承诺，投资有风险，入场需谨慎。'

    return res.json(successResponse({ narrative }, requestId))
  } catch (err: any) {
    console.error(`[${requestId}] portfolio-narrative error:`, err)
    return res.status(500).json(errorResponse('组合解读生成失败', requestId))
  }
})

export default router
