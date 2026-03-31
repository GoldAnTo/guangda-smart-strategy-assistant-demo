import { Router } from 'express'

import { buildChatPrompt } from '../prompts/builders'
import { aiService } from '../services/ai-service'
import { complianceService } from '../services/compliance-service'
import { ruleService } from '../services/rule-service'
import { errorResponse, successResponse } from '../utils/response'

const router = Router()

router.post('/api/chat', async (req, res) => {
  const requestId = res.locals.requestId

  try {
    const { question, context } = req.body

    if (!question || !context) {
      return res.status(400).json(errorResponse('missing params', requestId))
    }

    const escalation = ruleService.checkChatEscalation(question)
    if (escalation.shouldEscalate) {
      return res.json(successResponse({
        answer: '这个问题涉及更具体的正式推荐或敏感判断，建议由客户经理进一步确认后沟通。',
        complianceChecked: true,
        shouldEscalate: true
      }, requestId))
    }

    const prompt = buildChatPrompt(question, context)
    const rawAnswer = await aiService.generateText(prompt)
    const answer = complianceService.cleanChatAnswer(rawAnswer)

    return res.json(successResponse({
      answer,
      complianceChecked: true,
      shouldEscalate: false
    }, requestId))
  } catch (error) {
    console.error(`[${requestId}] chat error:`, error)
    return res.status(500).json(errorResponse('failed to chat', requestId))
  }
})

export default router
