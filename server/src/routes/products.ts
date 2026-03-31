import { Router } from 'express'
import { successResponse, errorResponse } from '../utils/response'
import productsData from '../data/products.json'

const router = Router()

// GET /products - List all products
router.get('/products', (req, res) => {
  const requestId = res.locals.requestId
  res.json(successResponse({ products: productsData }, requestId))
})

// GET /products/:id - Get single product
router.get('/products/:id', (req, res) => {
  const requestId = res.locals.requestId
  const id = req.params.id
  const product = (productsData as Record<string, unknown>[]).find(p => String(p.id) === id)
  if (!product) {
    return res.status(404).json({ code: 404, message: `产品不存在: ${id}`, requestId })
  }
  res.json(successResponse({ product }, requestId))
})

export default router
