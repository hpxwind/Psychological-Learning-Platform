import { Router } from 'express';
import { celebrityChat } from '../controllers/agentController.js';

const router = Router();

// 名人对话 - 通过 Agent 智能体回答
router.post('/celebrity-chat', celebrityChat);

export default router;
