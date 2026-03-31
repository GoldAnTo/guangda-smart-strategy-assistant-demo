import { Router } from 'express'

import { buildExplanationPrompt } from '../prompts/builders'
import { aiService } from '../services/ai-service'
import { complianceService } from '../services/compliance-service'
import { explanationService } from '../services/explanation-service'
import { errorResponse, successResponse } from '../utils/response'

const router = Router()

router.post('/api/generate-explanation', async (req, res) => {
  const requestId = res.locals.requestId

  try {
    const { profile, recommended, excluded } = req.body

    if (!profile || !recommended) {
      return res.status(400).json(errorResponse('missing params', requestId))
    }

    const prompt = buildExplanationPrompt({ profile, recommended, excluded })
    const rawResult = await aiService.generateJson(prompt)
    const explanation = explanationService.safeParseExplanation(rawResult)
    const cleaned = complianceService.cleanExplanation(explanation)

    return res.json(successResponse(cleaned, requestId))
  } catch (error) {
    console.error(`[${requestId}] generate-explanation error:`, error)
    return res.status(500).json(errorResponse('failed to generate explanation', requestId))
  }
})

export default router
