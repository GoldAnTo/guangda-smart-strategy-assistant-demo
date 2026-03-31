export const customerTypeLabels: Record<string, string> = {
  individual: '个人客户',
  high_net_worth: '高净值客户',
  institutional: '机构客户'
}

export const riskLevelLabels: Record<string, string> = {
  conservative: '保守型',
  stable: '稳健型',
  balanced: '平衡型',
  aggressive: '进取型',
  custom: '定制型',
  R1: 'R1',
  R2: 'R2',
  R3: 'R3'
}

export const horizonLabels: Record<string, string> = {
  short_term: '短期',
  mid_term: '中期',
  long_term: '长期',
  custom: '定制'
}

export const liquidityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  medium_low: '中低',
  low: '低',
  custom: '定制'
}

export const goalLabels: Record<string, string> = {
  capital_stability: '稳健保值',
  stable_enhancement: '稳健增厚',
  balanced_growth: '平衡增长',
  high_return: '高收益导向',
  custom_need: '定制需求',
  holding_explanation: '持有中解释',
  portfolio_balance: '组合平衡'
}

export const drawdownLabels: Record<string, string> = {
  very_low: '极低',
  low: '低',
  medium: '中',
  high: '高'
}

export function labelOf(map: Record<string, string>, value?: string | null) {
  if (!value) return '-'
  return map[value] || value
}
