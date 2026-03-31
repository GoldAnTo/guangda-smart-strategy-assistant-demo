const http = require('http');
const body = JSON.stringify({
  components: [
    { name: '低价转债', weight: 50, annualReturn: 12.28, volatility: 5.2, maxDrawdown: 8.05 },
    { name: '非周期行业红利', weight: 50, annualReturn: 16.3, volatility: 8.3, maxDrawdown: 10.48 }
  ],
  portfolioReturn: 14.29,
  portfolioVolatility: 6.75,
  portfolioMaxDrawdown: 9.27,
  portfolioSharpe: 2.12
});
const req = http.request({ hostname: '127.0.0.1', port: 3003, path: '/api/portfolio-narrative', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const p = JSON.parse(data);
    const n = (p.data || p).narrative;
    console.log('Status:', res.statusCode);
    console.log('Length:', n?.length);
    console.log(n);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body); req.end();
