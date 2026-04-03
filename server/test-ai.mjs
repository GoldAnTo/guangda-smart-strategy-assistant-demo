import { aiService } from './src/services/ai-service.ts'

// Full attribution prompt
const prompt = `你是一名资深基金策略归因分析专家。请对以下策略在近一月期间的表现进行深度归因分析，返回结构化 JSON。

【策略详细信息】
- 策略名称：量化alpha对冲
- 资产类别：股票策略
- 风险等级：中等风险
- 近一月收益：+12.50%
- 年化收益率：+12.50%
- 胜率：68%
- 最大回撤：-8.50%
- 波动率：9.20%
- 夏普比率：1.47

返回 JSON：{"marketInsight":"...","strategyDriver":"...","riskRewardAnalysis":"...","configValue":"...","summary":"...","riskWarning":"..."}`;

const TIMEOUT_MS = 40_000

try {
  const r = await Promise.race([
    aiService.generateText(prompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI call timeout 40s')), TIMEOUT_MS))
  ])
  console.log('SUCCESS long, len=' + r.length)
  console.log(r.slice(0, 500))
} catch (e) {
  console.log('ERROR:', e.message)
}
process.exit(0)