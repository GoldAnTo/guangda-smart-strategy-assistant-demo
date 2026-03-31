const body = JSON.stringify({
  strategies: [{
    name: '量化alpha对冲策略',
    navCategory: '量化策略',
    annualReturn: 12.5,
    winRate: 68,
    maxDrawdown: 8.5,
    sharpe: 1.47,
    volatility: 9.2,
    riskLevel: 'R4',
    investmentHorizon: 'medium_term',
    logicSummary: '基于多因子模型的量化选股策略，通过衍生品对冲系统性风险',
    tags: ['量化', '对冲', '绝对收益'],
    owner: '光大资管',
    benchmarkName: '沪深300'
  }],
  returnTarget: 'moderate',
  riskLevel: 'R4'
})

const start = Date.now()
console.log('Sending...')

fetch('http://localhost:3003/api/recommend-narrative', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body
}).then(r => {
  console.log('Status:', r.status, 'Time:', Date.now() - start + 'ms')
  console.log('Content-Type:', r.headers.get('content-type'))
  return r.text()
}).then(d => {
  console.log('Response length:', d.length)
  console.log('Response:', d.slice(0, 400))
  process.exit(0)
}).catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
