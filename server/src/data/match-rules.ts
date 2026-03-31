export const rules = {
  validRiskLevels: ['conservative', 'stable', 'stable_enhancement', 'balanced'],
  validGoalTags: ['stable_enhancement', 'growth', 'balanced_growth', 'income', 'stable_income', 'cash_enhancement', 'short_term', 'mid_term', 'long_term'],
  validHorizonTags: ['short_term', 'mid_short', 'mid_term', 'mid_long', 'long_term'],
  validLiquidityTags: ['high', 'medium', 'low'],
  validVolatilityTags: ['极低', '低', '中低', '中等', '较高', 'unknown'],
  validDurationTags: ['short_term', 'mid_short', 'mid_term', 'mid_long', 'long_term', 'unknown'],
  riskConflictRules: [
    { clientRisk: 'conservative', productRisk: 'R3', reason: '客户风险承受能力低于产品风险等级' },
    { clientRisk: 'conservative', productRisk: 'R4', reason: '客户风险承受能力低于产品风险等级' },
    { clientRisk: 'conservative', productRisk: 'R5', reason: '客户风险承受能力低于产品风险等级' },
    { clientRisk: 'stable', productRisk: 'R3', reason: '客户风险承受能力低于产品风险等级' },
    { clientRisk: 'stable', productRisk: 'R4', reason: '客户风险承受能力低于产品风险等级' },
    { clientRisk: 'stable', productRisk: 'R5', reason: '客户风险承受能力低于产品风险等级' },
    { clientRisk: 'stable_enhancement', productRisk: 'R4', reason: '客户风险承受能力低于产品风险等级' },
    { clientRisk: 'stable_enhancement', productRisk: 'R5', reason: '客户风险承受能力低于产品风险等级' },
  ],
}

export const scenarios = [
  {
    id: 'scenario_01',
    name: '场景一：稳健型 中短期理财',
    clientProfile: {
      riskLevel: 'stable',
      goalTag: 'stable_enhancement',
      horizonTag: 'mid_short',
      liquidityTag: 'high',
    },
    description: '张女士，45岁，国有企业财务经理，家庭年收入约50万元。目前有100万元闲置资金，计划6个月后女儿出国留学需要用到这笔钱，希望保本基础上获取稳定收益。'
  },
  {
    id: 'scenario_02',
    name: '场景二：稳健增强型 中期配置',
    clientProfile: {
      riskLevel: 'stable_enhancement',
      goalTag: 'stable_enhancement',
      horizonTag: 'mid_term',
      liquidityTag: 'medium',
    },
    description: '李先生，38岁，科技公司中层管理，年收入80万元，现有积蓄200万元愿意做2-3年中长期配置，追求稳健但希望有一定收益增强。'
  },
  {
    id: 'scenario_03',
    name: '场景三：保守型 短期现金管理',
    clientProfile: {
      riskLevel: 'conservative',
      goalTag: 'cash_enhancement',
      horizonTag: 'short_term',
      liquidityTag: 'high',
    },
    description: '王先生，60岁，退休人员，有300万储蓄需要安全管理，日常开支和应急备用金，主要关注本金安全，流动性要求极高。'
  },
  {
    id: 'scenario_04',
    name: '场景四：平衡型 长期养老规划',
    clientProfile: {
      riskLevel: 'balanced',
      goalTag: 'balanced_growth',
      horizonTag: 'long_term',
      liquidityTag: 'low',
    },
    description: '陈女士，35岁，外企主管，年收入100万元，距离退休还有20多年，愿意承受一定波动追求长期资本增值，养老储备规划。'
  },
  {
    id: 'scenario_05',
    name: '场景五：稳健型 短期过渡资金',
    clientProfile: {
      riskLevel: 'stable',
      goalTag: 'short_term',
      horizonTag: 'short_term',
      liquidityTag: 'high',
    },
    description: '刘先生，50岁，个体工商户，账上暂时有50万资金，预计3个月内要用于支付供应商货款，闲置期间希望获取高于活期的稳定收益。'
  },
  {
    id: 'scenario_06',
    name: '场景六：稳健增强型 中短期追求收益增强',
    clientProfile: {
      riskLevel: 'stable_enhancement',
      goalTag: 'stable_enhancement',
      horizonTag: 'mid_short',
      liquidityTag: 'medium',
    },
    description: '赵女士，42岁，医院医生，年收入60万元，有100万资金计划半年后购买房产，但希望通过短期固收+产品获得比纯债更高的收益。'
  },
  {
    id: 'scenario_07',
    name: '场景七：保守型 长期保本资金',
    clientProfile: {
      riskLevel: 'conservative',
      goalTag: 'stable_income',
      horizonTag: 'long_term',
      liquidityTag: 'low',
    },
    description: '孙先生，55岁，公务员，计划20年后退休，现有150万长期闲置资金购买大额存单类产品，考虑纯债或R1产品进行长期保本配置。'
  },
  {
    id: 'scenario_08',
    name: '场景八：稳健型 中长期教育金规划',
    clientProfile: {
      riskLevel: 'stable',
      goalTag: 'mid_term',
      horizonTag: 'mid_long',
      liquidityTag: 'medium',
    },
    description: '周女士，33岁，教师，年收入25万元，有2个孩子，分别计划8年和12年后上大学，希望现在起开始做教育金规划，偏好稳健产品。'
  },
  {
    id: 'scenario_09',
    name: '场景九：稳定收入型 退休后现金流',
    clientProfile: {
      riskLevel: 'stable',
      goalTag: 'income',
      horizonTag: 'long_term',
      liquidityTag: 'medium',
    },
    description: '郑先生，65岁，退休干部，退休后月固定养老金15000元，现有500万资产，希望通过配置收益型产品每月获得额外现金流补充养老金。'
  },
  {
    id: 'scenario_10',
    name: '场景十：稳健增强型 追求超额收益',
    clientProfile: {
      riskLevel: 'stable_enhancement',
      goalTag: 'growth',
      horizonTag: 'mid_term',
      liquidityTag: 'low',
    },
    description: '吴先生，40岁，风险投资人，年收入200万元，可承受一定净值波动追求年化6%-8%的收益目标，资金可以2-3年不用。'
  }
]
