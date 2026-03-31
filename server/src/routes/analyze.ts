import { Router } from 'express'

import { buildDemandPrompt } from '../prompts/builders'
import { aiService } from '../services/ai-service'
import { safeParseProfile } from '../services/demand-service'
import { errorResponse, successResponse } from '../utils/response'

const router = Router()

router.post('/api/analyze-demand', async (req, res) => {
  const requestId = res.locals.requestId

  try {
    const input = req.body

    if (!input) {
      return res.status(400).json(errorResponse('missing input', requestId))
    }

    const prompt = buildDemandPrompt(input)
    const rawResult = await aiService.generateJson(prompt)
    const profile = safeParseProfile(rawResult)

    return res.json(successResponse({ profile }, requestId))
  } catch (error) {
    console.error(`[${requestId}] analyze-demand error:`, error)
    return res.status(500).json(errorResponse('failed to analyze demand', requestId))
  }
})

export default router
