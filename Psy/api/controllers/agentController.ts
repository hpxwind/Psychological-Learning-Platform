import { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Agent API 地址
const AGENT_API_BASE = process.env.AGENT_API_URL || 'http://localhost:8000';

/**
 * 名人对话 - 代理到 Agent 智能体
 * 读取该名人的知识库文件（约束+知识），通过 Agent 进行 RAG 回答
 */
export const celebrityChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { celebrity_id, celebrity_name, query } = req.body;

    if (!celebrity_id || !query) {
      res.status(400).json({ success: false, message: 'celebrity_id 和 query 是必填项' });
      return;
    }

    // 名人名称用于查找知识库文件夹
    const safeName = (celebrity_name || `famous_${celebrity_id}`).replace(/[<>:"/\\|?*]/g, '_');
    const knowledgeDir = path.join(__dirname, '../../public/knowledge', safeName);

    // 读取约束文件
    let constraint = '';
    const constraintPath = path.join(knowledgeDir, 'constraint.txt');
    if (fs.existsSync(constraintPath)) {
      constraint = fs.readFileSync(constraintPath, 'utf-8');
    }

    // partition_id 使用名人名称
    const partition_id = `famous_${safeName}`;

    // 调用 Agent API
    const agentResponse = await fetch(`${AGENT_API_BASE}/api/celebrity/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        celebrity_id: String(celebrity_id),
        constraint,
        query,
        partition_id,
        k: 3
      })
    });

    if (!agentResponse.ok) {
      const errText = await agentResponse.text();
      console.error('[Agent] Celebrity chat failed:', agentResponse.status, errText);
      res.status(502).json({ success: false, message: 'Agent 服务响应异常' });
      return;
    }

    const agentData = await agentResponse.json();

    res.json({
      success: true,
      reply: agentData?.data?.answer || '抱歉，暂时无法回答。',
      sources: agentData?.data?.sources || []
    });
  } catch (error: any) {
    console.error('[Agent] Celebrity chat error:', error.message);
    // Agent 不可用时降级到普通 AI 聊天
    try {
      const { default: fetch } = await import('node-fetch');
      const fallbackResponse = await fetch(`${AGENT_API_BASE}/api/celebrity/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          celebrity_id: String(req.body.celebrity_id),
          constraint: '',
          query: req.body.query,
          partition_id: null,
          k: 0
        })
      });
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        res.json({ success: true, reply: data?.data?.answer || '抱歉，暂时无法回答。', sources: [] });
        return;
      }
    } catch {
      // 最终降级
    }
    res.status(500).json({ success: false, message: 'Agent 服务不可用，请稍后重试' });
  }
};
