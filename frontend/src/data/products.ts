import type { StrategyContext } from '../types/chat'

export type ProductDetail = StrategyContext & {
  riskLevel: string
  standardPitch: string
  recommendTags: string[]
  oneYearReturn: string
  maxDrawdown: string
  updateDate: string
  dataSource: string
  trend: number[]
  chartColor: string
  chartLabel: string
  liquidityText: string
  durationText: string
  benchmarkName: string
  benchmarkReturn: string
  benchmarkDrawdown: string
  returnSources: string[]
  assetMix: string[]
  risks: string[]
  advisorView: string
  clientFocus: string[]
  leadershipFocus: string[]
  faqPrompts: string[]
}

export const products: ProductDetail[] = [
  {
    id: 'bond-006',
    name: '安盈纯债6个月',
    productLine: '纯债',
    riskLevel: 'R2',
    strategy: '以高等级债券为主，整体更偏稳，适合先把持有体验和回撤控制放在前面的资金安排。',
    suitableFor: ['重视稳健、对回撤比较敏感的客户', '希望中短期配置更平缓一些的资金'],
    notSuitableFor: ['追求明显收益弹性的客户'],
    standardRiskNotice: '产品净值会受市场波动影响，不构成收益承诺。',
    standardPitch: '更适合把“稳一点”放在前面的客户。',
    recommendTags: ['稳健', '中期', '低波动'],
    oneYearReturn: '4.12%',
    maxDrawdown: '-0.68%',
    updateDate: '2026-03-15',
    dataSource: '产品月报及内部展示口径整理',
    trend: [32, 34, 35, 37, 39, 41, 42, 44, 45, 47, 49, 50],
    chartColor: '#1e5b87',
    chartLabel: '平稳上行',
    liquidityText: '中高流动性',
    durationText: '6个月以上持有体验更佳',
    benchmarkName: '中长期纯债指数',
    benchmarkReturn: '3.79%',
    benchmarkDrawdown: '-0.81%',
    returnSources: ['票息收益', '部分资本利得'],
    assetMix: ['利率债', '政策性金融债', '高等级信用债'],
    risks: ['利率波动', '信用利差变化'],
    advisorView: '这类方向更适合把稳健性放在首位的客户，尤其适合先求净值体验平稳，再考虑收益增厚的资金安排。',
    clientFocus: ['净值波动通常更平缓', '适合先看稳健性和持有体验', '更适合回撤敏感型资金安排'],
    leadershipFocus: ['作为稳健底仓类展示产品更容易被理解', '收益与回撤口径清晰，便于做客户教育', '适合承担策略矩阵里的“稳健锚点”角色'],
    faqPrompts: ['这只产品为什么更适合稳健型客户？', '它和固收增强最大的差异是什么？', '如果我半年可能要用钱，这只产品适合先看吗？']
  },
  {
    id: 'fsplus-001',
    name: '稳盈固收增强1号',
    productLine: '固收增强',
    riskLevel: 'R2',
    strategy: '以债券打底，在控制整体风险的基础上争取一定收益增厚，整体更适合想稳中求进的客户。',
    suitableFor: ['希望稳健基础上再多一些收益弹性的客户', '可以接受轻微净值波动的中期资金'],
    notSuitableFor: ['要求极高流动性的客户', '无法接受任何净值波动的客户'],
    standardRiskNotice: '本产品不保证收益，净值可能随市场变化出现波动。',
    standardPitch: '适合希望在稳健基础上争取一定增厚空间的客户。',
    recommendTags: ['稳健', '增厚', '中期'],
    oneYearReturn: '4.86%',
    maxDrawdown: '-1.18%',
    updateDate: '2026-03-15',
    dataSource: '产品月报及内部展示口径整理',
    trend: [28, 33, 31, 37, 41, 39, 44, 47, 45, 50, 54, 57],
    chartColor: '#a16d2e',
    chartLabel: '稳中有波动',
    liquidityText: '中等流动性',
    durationText: '更适合中期配置',
    benchmarkName: '中长期纯债指数',
    benchmarkReturn: '3.91%',
    benchmarkDrawdown: '-0.82%',
    returnSources: ['票息收益', '资本利得', '增强收益'],
    assetMix: ['利率债', '信用债', '同业存单', '转债'],
    risks: ['利率波动', '信用风险', '转债波动'],
    advisorView: '这类方向适合希望“稳一点，但不要太保守”的客户。和纯债相比，它更有收益增厚空间，但也需要接受轻微波动。',
    clientFocus: ['比纯债更有收益弹性', '适合愿意接受轻微波动的客户', '更像稳中求进的中期配置方向'],
    leadershipFocus: ['适合放在策略矩阵中承担“增厚型”角色', '展示上容易和纯债形成清晰分层', '更有助于讲清楚“稳和弹性之间的平衡”'],
    faqPrompts: ['这只产品和纯债相比，主要差在哪？', '为什么它的收益更高，但回撤也更大一点？', '如果我想稳中多一点弹性，应该先怎么看它？']
  },
  {
    id: 'cash-enh-01',
    name: '流动性优选现金增强',
    productLine: '低波稳健',
    riskLevel: 'R1',
    strategy: '整体更强调高流动性和低波动，适合短期停放或对资金可用性要求更高的安排。',
    suitableFor: ['短期闲置资金', '高流动性优先客户'],
    notSuitableFor: ['追求明显收益增厚的客户'],
    standardRiskNotice: '收益以稳健为目标，但不构成收益承诺。',
    standardPitch: '更适合把“随时可用”和“尽量稳”放在前面的资金安排。',
    recommendTags: ['短期', '高流动性', '低波动'],
    oneYearReturn: '2.31%',
    maxDrawdown: '-0.09%',
    updateDate: '2026-03-15',
    dataSource: '产品月报及内部展示口径整理',
    trend: [36, 36.5, 37, 38, 38.5, 39, 40, 40.5, 41, 41.5, 42, 42.5],
    chartColor: '#4f7a62',
    chartLabel: '低波平缓',
    liquidityText: '高流动性',
    durationText: '更适合短期停放',
    benchmarkName: '现金管理类参考基准',
    benchmarkReturn: '2.04%',
    benchmarkDrawdown: '-0.10%',
    returnSources: ['票息收益', '稳健增强收益'],
    assetMix: ['现金类资产', '短久期债券', '同业存单'],
    risks: ['收益弹性有限', '市场利率变化'],
    advisorView: '这类方向更像资金管理工具，适合短期安排和高流动性需求，不适合期待明显收益弹性的客户。',
    clientFocus: ['更适合短期闲置资金', '流动性要求高时更容易理解', '收益弹性有限，但持有压力更小'],
    leadershipFocus: ['适合作为高流动性产品展示入口', '方便承接短期资金客户场景', '在策略矩阵里承担“流动性管理”角色更清晰'],
    faqPrompts: ['这只产品为什么更适合短期资金？', '它和纯债相比，最大的区别是什么？', '如果我担心临时要用钱，这类方向是不是更适合先看？']
  }
]

export function getProductById(id: string) {
  return products.find((item) => item.id === id)
}
