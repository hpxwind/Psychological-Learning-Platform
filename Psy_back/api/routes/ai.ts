import express from 'express'
import { chatWithAI } from '../controllers/aiController.js'

const router = express.Router()

// AI聊天接口
router.post('/chat', chatWithAI)

export default router
