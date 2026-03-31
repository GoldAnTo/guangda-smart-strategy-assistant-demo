import { Router } from 'express'
import { recommendService, type CustomerProfile } from '../services/recommend-service'
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
router.post('/api/recommend-narrative', (req, res) => {
  const requestId = res.locals.requestId
  try {
    const { strategies } = req.body as { strategies: any[]; profile?: any }
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

    function fmtPct(v: number | null | undefined): string {
      if (v == null) return '—'
      return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
    }
    function safeGet(obj: any, key: string, fallback = ''): string {
      return obj != null && obj[key] != null ? String(obj[key]) : fallback
    }
    function safeList(arr: any): string[] {
      return Array.isArray(arr) ? arr.filter(Boolean).map(String) : []
    }

    const topRisk = riskLevelMap[top.riskLevel] || top.riskLevel || '中等风险'
    const topHorizon = horizonMap[top.investmentHorizon] || top.investmentHorizon || '中期'
    const topLiquidity = safeGet(top, 'liquidityDisplay', '中等流动性')
    const topReturn = fmtPct(top.annualReturn)
    const topSharpe = top.sharpe != null ? top.sharpe.toFixed(2) : '—'
    const topMaxDD = top.maxDrawdown != null ? top.maxDrawdown.toFixed(2) + '%' : '—'
    const topMatchReasons = safeList(top.matchReasons).slice(0, 3)
    const topSuitable = safeList(top.suitableFor)
    const topNotSuitable = safeList(top.notSuitableFor)
    const topTags = safeList(top.tags).slice(0, 4).join('、')
    const topPositioning = safeGet(top, 'positioning', '').replace(/\n/g, '，').trim()
    const topOwner = safeGet(top, 'owner', '')
    const topNavCat = safeGet(top, 'navCategory', '')

    const annR = top.annualReturn ?? 0
    const maxDD = top.maxDrawdown ?? 0

    // 收益质量评价
    let returnQuality: string
    if (annR >= 20) returnQuality = '收益极具吸引力，年化收益在同类策略中处于领先水平'
    else if (annR >= 10) returnQuality = '收益表现稳健，处于同类策略中上水平'
    else if (annR >= 0) returnQuality = '收益相对平稳，但需关注收益持续性'
    else returnQuality = '当前收益为负，建议关注市场环境和策略周期'

    // 回撤质量评价
    let riskQuality: string
    if (maxDD <= 5) riskQuality = '回撤控制极为出色，适合风险厌恶型客户'
    else if (maxDD <= 10) riskQuality = '回撤控制在合理区间，符合中等风险定位'
    else if (maxDD <= 20) riskQuality = '回撤相对较大，需在充分了解风险后配置'
    else riskQuality = '最大回撤较高，建议风险承受能力强的客户关注'

    // 夏普质量评价
    let sharpeQuality: string
    const shNum = top.sharpe != null ? parseFloat(top.sharpe.toFixed(2)) : null
    if (shNum !== null && shNum >= 2.0) sharpeQuality = '夏普比率超过2.0，风险调整后收益极为优秀'
    else if (shNum !== null && shNum >= 1.5) sharpeQuality = '夏普比率超过1.5，风险收益特征优异'
    else if (shNum !== null && shNum >= 1.0) sharpeQuality = '夏普比率超过1.0，优于市场平均水平'
    else if (shNum !== null) sharpeQuality = '夏普比率偏低，反映风险收益效率有提升空间'
    else sharpeQuality = '夏普比率暂无数据，建议参考其他风险指标综合评估'

    // 匹配逻辑段落
    let matchPara = ''
    if (topMatchReasons.length > 0) {
      matchPara = '在匹配度方面，本策略的核心优势是：' + topMatchReasons.join('；') + '，与您的需求高度吻合。'
    }
    let posPara = ''
    if (topPositioning) {
      posPara = '从策略定位来看，' + topPositioning.substring(0, 60) + '。'
    }

    // 对比段落
    let comparePara = ''
    if (rest.length > 0) {
      const restParts = rest.map((s, i) => {
        const sRet = fmtPct(s.annualReturn)
        const sRisk = riskLevelMap[s.riskLevel] || s.riskLevel || '中等风险'
        const sMaxDD = s.maxDrawdown ?? 0
        const sHorizon = horizonMap[s.investmentHorizon] || s.investmentHorizon || '中期'
        const sLiquidity = safeGet(s, 'liquidityDisplay', '中等流动性')
        const diff = (s.annualReturn ?? 0) - annR
        let retDiff: string
        if (diff > 1) retDiff = '年化收益高于本策略' + Math.abs(diff).toFixed(1) + '个百分点，进攻性更强'
        else if (diff < -1) retDiff = '年化收益低于本策略' + Math.abs(diff).toFixed(1) + '个百分点，更注重防守'
        else retDiff = '年化收益与本策略基本持平'
        let ddDiff: string
        if (sMaxDD < maxDD - 2) ddDiff = '最大回撤也更小，整体风险更可控'
        else if (sMaxDD > maxDD + 2) ddDiff = '但最大回撤高出' + (sMaxDD - maxDD).toFixed(1) + '个百分点'
        else ddDiff = '回撤水平与本策略相近'
        const horizonDiff = s.investmentHorizon !== top.investmentHorizon
          ? '；资金期限' + sHorizon + '，' + sLiquidity : ''
        return (i + 2) + '. ' + s.name + '（' + sRet + '，' + sRisk + '）' + retDiff + '，' + ddDiff + horizonDiff
      })
      comparePara = '从备选方案来看：' + restParts.join('；') + '。综合来看，本策略在风险收益效率上具备明显优势，值得优先关注。'
    } else {
      comparePara = '当前仅有首选策略，未发现更优备选方案。'
    }

    // 适配人群段落
    const suitableText = topSuitable.length > 0
      ? topSuitable.slice(0, 3).join('、')
      : topRisk + '风险偏好，资金可用期限' + topHorizon + '的客户'
    const notSuitableText = topNotSuitable.length > 0
      ? '不适合人群：' + topNotSuitable.slice(0, 2).join('、') + '的客户不建议配置本策略。'
      : ''

    // 组装最终narrative
    const n1 = top.name + '（' + topNavCat + '）是本次推荐中的首选方案。' + returnQuality + '。' + riskQuality + '。' + sharpeQuality + '。'
    const n2 = (matchPara + ' ' + posPara).trim()
    const n3 = comparePara
    const n4 = '本策略最大历史回撤为' + topMaxDD + '，意味着在最不利情况下持有体验会有较大波动，请做好相应心理准备。历史收益不代表未来表现，策略可能因市场环境变化而出现与历史业绩差异较大的情况。'
    const n5 = notSuitableText ? notSuitableText + ' ' : ''
    const n6 = '适合人群：' + suitableText + '。建议投资期限不低于' + topHorizon + '，以平滑市场短期波动带来的影响。'
    const n7 = '管理者：' + (topOwner || '光大资管') + ' | 策略标签：' + (topTags || '量化，多资产') + ' | 投资有风险，决策前请详阅产品说明书。'

    const narrative =
      '【核心推荐逻辑】\n\n' + n1 + '\n' + (n2 ? n2 + '\n\n' : '\n\n') +
      '【与备选策略对比】\n\n' + n3 + '\n\n' +
      '【风险提示与适配人群】\n\n' +
      '风险提示：' + n4 + '\n' +
      (n5 ? n5 + '\n' : '') +
      n6 + '\n\n' +
      n7

    return res.json(successResponse({ narrative }, requestId))
  } catch (err: any) {
    console.error(`[${requestId}] recommend-narrative error:`, err)
    return res.status(500).json(errorResponse('Narrative生成失败', requestId))
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
