import https from 'https'

const apiKey = 'sk-2mZssgeqI9MtQdWKOMKGNjtjPcPFlumfQMl5h0MEyq9euYer'

// 测试1：简短中文 prompt
const shortPrompt = '用一句话评价年化收益15.8%、夏普比率1.86的量化策略，返回JSON：{"brief":"..."}'

// 测试2：完整归因 prompt（去掉 **）
const longPrompt = `你是一名资深基金策略归因分析专家。请对以下策略在近一年期间的表现进行深度归因分析，必须基于给出的具体数据给出有洞察的分析，不要泛泛而谈。返回结构化 JSON。

【策略详细信息】
- 策略名称：量化alpha对冲
- 资产类别：股票策略
- 风险等级：中等风险
- 近一年收益：+15.80%
- 年化收益率：+15.80%
- 胜率：72%
- 最大回撤：-6.20%
- 波动率：8.50%
- 夏普比率：1.86
- 核心策略逻辑：基于多因子量化模型的Alpha选股策略，配合股指期货对冲市场风险
- 策略标签：量化、alpha对冲、多因子

返回纯 JSON：{"marketInsight":"...","strategyDriver":"...","riskRewardAnalysis":"...","configValue":"...","summary":"...","riskWarning":"..."}`

async function test(prompt, label) {
  console.log(`\n=== ${label} ===`)
  const body = JSON.stringify({ model: 'gpt-5.4', input: prompt, max_tokens: 1500 })
  const options = {
    hostname: 'zxcode.vip',
    port: 443,
    path: '/v1/responses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'Content-Length': Buffer.byteLength(body)
    }
  }
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        console.log('STATUS:', res.statusCode)
        console.log('RESP:', d.slice(0, 400))
        resolve()
      })
    })
    req.on('error', e => { console.log('ERR:', e.message); resolve() })
    req.on('timeout', () => { console.log('TIMEOUT'); req.destroy(); resolve() })
    req.setTimeout(60000)
    req.write(body)
    req.end()
    console.log('请求已发送...')
  })
}

await test(shortPrompt, '测试1：简短中文')
await test(longPrompt, '测试2：完整归因中文长prompt')
process.exit(0)
