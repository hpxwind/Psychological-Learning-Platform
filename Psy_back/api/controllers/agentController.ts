import { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { type RowDataPacket } from 'mysql2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Agent API 地址
const AGENT_API = process.env.AGENT_API || 'http://localhost:8000';

// 读取名人约束文件
function readConstraintFile(celebrityName: string): string {
  const safeName = celebrityName.replace(/[<>:"/\\|?*]/g, '_');
  const constPath = path.join(__dirname, '../../public/knowledge', safeName, 'constraint.txt');
  if (fs.existsSync(constPath)) {
    return fs.readFileSync(constPath, 'utf-8');
  }
  return '';
}

// 名人对话（走 Agent RAG）
export const celebrityChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { celebrity_id, celebrity_name, query } = req.body;

    if (!query || !query.trim()) {
      res.status(400).json({ success: false, message: '提问内容不能为空' });
      return;
    }

    // 读取约束文件
    const constraint = celebrity_name ? readConstraintFile(celebrity_name) : '';

    // 构建分区 ID
    const safeName = (celebrity_name || `famous_${celebrity_id}`).replace(/[<>:"/\\|?*]/g, '_');
    const partitionId = `famous_${safeName}`;

    // 尝试调用 Agent API
    try {
      const agentRes = await fetch(`${AGENT_API}/api/celebrity/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          celebrity_id: String(celebrity_id),
          constraint,
          query: query.trim(),
          partition_id: partitionId,
          k: 3
        })
      });

      if (agentRes.ok) {
        const data = await agentRes.json();
        res.json({
          success: true,
          reply: data.data?.answer || '暂无回答',
          sources: data.data?.sources || []
        });
        return;
      }
    } catch (err) {
      console.warn('[agentController] Agent API 不可用，降级到普通 AI:', (err as Error).message);
    }

    // 降级：使用数据库中的名人信息构建上下文，走本地 AI
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT name, introduction, life_story, works, theory FROM famous_people WHERE id = ?',
      [celebrity_id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    const c = rows[0];

    let context = constraint;
    if (!context) {
      context = `你正在扮演${c.name}。`;
      const intro = c.introduction?.substring(0, 200) || '';
      if (intro) context += `\n简介：${intro}`;
      const story = c.life_story?.substring(0, 500) || '';
      if (story) context += `\n生平：${story}`;
      const works = c.works?.substring(0, 300) || '';
      if (works) context += `\n著作：${works}`;
      const theory = c.theory?.substring(0, 500) || '';
      if (theory) context += `\n理论：${theory}`;
    }
    context += `\n\n请以他/她的口吻、思想和风格来回答以下问题。保持回答简洁、有深度，符合他/她的理论体系：\n\n${query.trim()}`;

    // 优先走腾讯混元 API（已配置）
    const HUNYUAN_KEY = process.env.TENCENT_HUNYUAN_API_KEY;
    if (HUNYUAN_KEY?.startsWith('sk-')) {
      try {
        const hyRes = await fetch('https://api.hunyuan.cloud.tencent.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUNYUAN_KEY}`
          },
          body: JSON.stringify({
            model: 'hunyuan-lite',
            messages: [{ role: 'user', content: context }],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (hyRes.ok) {
          const data = await hyRes.json();
          const reply = data.choices?.[0]?.message?.content || '暂无回答';
          res.json({ success: true, reply, sources: [] });
          return;
        } else {
          console.warn('[agentController] 混元 API 返回错误:', hyRes.status);
        }
      } catch (err2) {
        console.error('[agentController] 混元 API 调用失败:', (err2 as Error).message);
      }
    }

    // 再降级到 DeepSeek
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_BASE_URL) {
      try {
        const dsRes = await fetch(`${process.env.DEEPSEEK_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: context }]
          })
        });
        if (dsRes.ok) {
          const data = await dsRes.json();
          res.json({
            success: true,
            reply: data.choices?.[0]?.message?.content || '暂无回答',
            sources: []
          });
          return;
        }
      } catch {}
    }

    res.json({ success: false, message: 'AI 服务暂时不可用' });
  } catch (error) {
    console.error('[agentController] celebrityChat error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
