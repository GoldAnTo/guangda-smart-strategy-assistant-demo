import { Router } from 'express'

import { matchService } from '../services/match-service'
import { productService } from '../services/product-service'
import { ruleService } from '../services/rule-service'
import { errorResponse, successResponse } from '../utils/response'

const router = Router()

router.post('/api/match-products', async (req, res) => {
  const requestId = res.locals.requestId

  try {
    const { profile } = req.body

    if (!profile) {
      return res.status(400).json(errorResponse('missing profile', requestId))
    }

    const escalation = ruleService.checkEscalation(profile)
    if (escalation.shouldEscalate) {
      return res.json(successResponse({
        recommended: [],
        excluded: [],
        shouldEscalate: true,
        escalationType: escalation.escalationType,
        escalationReason: escalation.reason,
        nextAction: escalation.nextAction
      }, requestId))
    }

    const products = productService.getProducts()
    const result = matchService.matchProducts(profile, products)

    return res.json(successResponse({
      recommended: result.recommended,
      excluded: result.excluded,
      shouldEscalate: false,
      escalationType: '',
      escalationReason: '',
      nextAction: ''
    }, requestId))
  } catch (error) {
    console.error(`[${requestId}] match-products error:`, error)
    return res.status(500).json(errorResponse('failed to match products', requestId))
  }
})

export default router
