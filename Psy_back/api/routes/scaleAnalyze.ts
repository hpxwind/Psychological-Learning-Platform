import express from 'express'
import { analyzeScaleResult } from '../controllers/aiController.js'

const router = express.Router()

// 量表结果AI分析接口
router.post('/analyze', analyzeScaleResult)

export default router
