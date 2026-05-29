import { Router } from 'express';
import { celebrityChat } from '../controllers/agentController.js';

const router = Router();

// 名人对话（走 Agent RAG）
router.post('/celebrity-chat', celebrityChat);

export default router;
