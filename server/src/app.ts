import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import analyzeRoute from './routes/analyze'
import chatRoute from './routes/chat'
import explainRoute from './routes/explain'
import matchRoute from './routes/match'
import portfolioRoute from './routes/portfolio'
import productsRoute from './routes/products'
import strategiesRoute from './routes/strategies'
import recommendRoute from './routes/recommend'
import attributionRoute from './routes/attribution'
import { errorResponse, successResponse, createRequestId } from './utils/response'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  // Force UTF-8 JSON responses to avoid mojibake in downstream clients.
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.locals.requestId = createRequestId()
  req.setTimeout?.(20000)
  next()
})

app.get('/health', (_req, res) => {
  res.json(successResponse({ ok: true, service: 'guangda-strategy-demo-server' }, res.locals.requestId))
})

app.get('/ready', (_req, res) => {
  const ready = Boolean(process.env.MODEL_API_URL && process.env.MODEL_API_KEY && process.env.MODEL_NAME)

  if (!ready) {
    return res.status(503).json(errorResponse('service is not ready', res.locals.requestId, {
      checks: {
        modelApiUrl: Boolean(process.env.MODEL_API_URL),
        modelApiKey: Boolean(process.env.MODEL_API_KEY),
        modelName: Boolean(process.env.MODEL_NAME)
      }
    }))
  }

  return res.json(successResponse({ ready: true }, res.locals.requestId))
})

app.use(analyzeRoute)
app.use(explainRoute)
app.use(chatRoute)
app.use(productsRoute)
app.use(strategiesRoute)
app.use(portfolioRoute)
app.use(recommendRoute)
app.use(attributionRoute)
app.use(matchRoute)

const port = Number(process.env.PORT || 3001)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
