import { type Request, type Response } from 'express';
import pool from '../config/db.js';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 辅助函数：根据 JSON 书ID数组解析出书籍详情
async function resolvePublishedBooks(publishedBooksRaw: string | null): Promise<{ id: number; title: string; cover_image: string }[]> {
  if (!publishedBooksRaw) return [];
  try {
    const ids: number[] = JSON.parse(publishedBooksRaw);
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const [bookRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, cover_image FROM books WHERE id IN (?)',
      [ids]
    );
    const bookMap = new Map<number, any>();
    for (const b of bookRows) bookMap.set(b.id, b);
    return ids.map(id => bookMap.get(id) || { id, title: '未知图书', cover_image: '' });
  } catch {
    return [];
  }
}

// 获取名人列表
export const getFamousPeople = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;

    let query = 'SELECT id, name, introduction, life_story, works, theory, influence, evaluation, published_books, gallery, photo, status_idle, status_listening, status_thinking, status_answered, created_at, updated_at FROM famous_people';
    const params: any[] = [];

    if (keyword) {
      query += ' WHERE name LIKE ?';
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // 批量解析出版图书
    const allBookIds = new Set<number>();
    for (const row of rows) {
      if (row.published_books) {
        try {
          const ids: number[] = JSON.parse(row.published_books);
          if (Array.isArray(ids)) ids.forEach(id => allBookIds.add(id));
        } catch { /* ignore parse errors */ }
      }
    }
    const bookMap = new Map<number, any>();
    if (allBookIds.size > 0) {
      const [bookRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, title, cover_image FROM books WHERE id IN (?)',
        [[...allBookIds]]
      );
      for (const b of bookRows) bookMap.set(b.id, b);
    }
    for (const row of rows) {
      const books: any[] = [];
      if (row.published_books) {
        try {
          const ids: number[] = JSON.parse(row.published_books);
          if (Array.isArray(ids)) {
            for (const id of ids) {
              books.push(bookMap.get(id) || { id, title: '未知图书', cover_image: '' });
            }
          }
        } catch { /* ignore */ }
      }
      row.published_books_detail = books;
    }

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM famous_people';
    const countParams: any[] = [];
    if (keyword) {
      countQuery += ' WHERE name LIKE ?';
      countParams.push(`%${keyword}%`);
    }
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get famous people error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 获取名人详情
export const getFamousPersonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM famous_people WHERE id = ?', [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    const data = rows[0];
    data.published_books_detail = await resolvePublishedBooks(data.published_books);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get famous person error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 创建名人
export const createFamousPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, introduction, life_story, works,
      theory, influence, evaluation, published_books, gallery,
      photo, status_idle, status_listening, status_thinking, status_answered
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: '姓名不能为空' });
      return;
    }

    // published_books 接收书ID数组，转为JSON字符串存储
    const publishedBooksStr = Array.isArray(published_books) ? JSON.stringify(published_books) : (published_books || '');

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO famous_people (name, introduction, life_story, works, theory, influence, evaluation, published_books, gallery, photo, status_idle, status_listening, status_thinking, status_answered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, introduction || '', life_story || '', works || '', theory || '', influence || '', evaluation || '', publishedBooksStr, gallery || '', photo || '', status_idle || '', status_listening || '', status_thinking || '', status_answered || '']
    );

    res.status(201).json({ success: true, message: '名人创建成功', id: result.insertId });
  } catch (error) {
    console.error('Create famous person error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 更新名人
export const updateFamousPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name, introduction, life_story, works,
      theory, influence, evaluation, published_books, gallery,
      photo, status_idle, status_listening, status_thinking, status_answered
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: '姓名不能为空' });
      return;
    }

    // 检查记录是否存在
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM famous_people WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    // published_books 接收书ID数组，转为JSON字符串存储
    const publishedBooksStr = Array.isArray(published_books) ? JSON.stringify(published_books) : (published_books || '');

    await pool.query(
      `UPDATE famous_people SET
        name = ?, introduction = ?, life_story = ?, works = ?,
        theory = ?, influence = ?, evaluation = ?, published_books = ?, gallery = ?,
        photo = ?, status_idle = ?, status_listening = ?, status_thinking = ?, status_answered = ?
       WHERE id = ?`,
      [name, introduction || '', life_story || '', works || '',
       theory || '', influence || '', evaluation || '', publishedBooksStr, gallery || '',
       photo || '', status_idle || '', status_listening || '', status_thinking || '', status_answered || '',
       id]
    );

    console.log('[updateFamousPerson] ✅ theory_len:', (theory || '').length, 'influence_len:', (influence || '').length, 'evaluation_len:', (evaluation || '').length);

    res.json({ success: true, message: '名人更新成功' });
  } catch (error) {
    console.error('Update famous person error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 删除名人
export const deleteFamousPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query<RowDataPacket[]>('SELECT id, name FROM famous_people WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    await pool.query('DELETE FROM famous_people WHERE id = ?', [id]);

    // 删除 Agent 分区
    const safeName = (existing[0].name || `famous_${id}`).replace(/[<>:"/\\|?*]/g, '_');
    const AGENT_API = process.env.AGENT_API || 'http://localhost:8000';
    try {
      await fetch(`${AGENT_API}/api/partitions/famous_${safeName}`, { method: 'DELETE' });
    } catch {}

    // 清理本地残留文件
    const knowledgeDir = path.join(__dirname, '../../public/knowledge', safeName);
    if (fs.existsSync(knowledgeDir)) {
      fs.rmSync(knowledgeDir, { recursive: true, force: true });
    }

    res.json({ success: true, message: '名人删除成功' });
  } catch (error) {
    console.error('Delete famous person error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== 知识库管理 ====================

// 获取名人知识库目录（Psy_back/public/knowledge/）
function getKnowledgeDir(nameOrId: string): string {
  const safeName = nameOrId.replace(/[<>:"/\\|?*]/g, '_');
  const dir = path.join(__dirname, '../../public/knowledge', safeName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// 上传知识库文件 → 直接存入 Agent 分区
export const uploadKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM famous_people WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    const celebrityName = rows[0].name || `famous_${id}`;
    const safeName = celebrityName.replace(/[<>:"/\\|?*]/g, '_');
    const partitionId = `famous_${safeName}`;
    const AGENT_API = process.env.AGENT_API || 'http://localhost:8000';

    // 确保 Agent 分区存在
    await fetch(`${AGENT_API}/api/partitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: partitionId, name: celebrityName, description: `${celebrityName}的知识库` })
    }).catch(() => console.warn('[Knowledge] 分区创建失败（可能已存在）'));

    const uploaded: string[] = [];

    // 处理约束文件：本地保留一份（agentController 需要读取），同时上传到 Agent
    if (files.constraint && files.constraint.length > 0) {
      const file = files.constraint[0];
      // 本地保留 constraint.txt
      const localDir = getKnowledgeDir(celebrityName);
      const localPath = path.join(localDir, 'constraint.txt');
      fs.copyFileSync(file.path, localPath);
      // 上传到 Agent
      await uploadFileToAgent(AGENT_API, partitionId, file.path, 'constraint.txt');
      fs.unlinkSync(file.path);
      uploaded.push('约束文件');
    }

    // 处理知识文件：仅上传到 Agent，不在后端存储
    if (files.knowledge && files.knowledge.length > 0) {
      const file = files.knowledge[0];
      const ext = path.extname(file.originalname) || '.txt';
      const agentFileName = `knowledge${ext}`;
      await uploadFileToAgent(AGENT_API, partitionId, file.path, agentFileName);
      fs.unlinkSync(file.path);
      uploaded.push('知识库文件');
    }

    console.log(`[Knowledge] 已上传 ${celebrityName} → Agent 分区 ${partitionId}，文件: ${uploaded.join(', ')}`);

    res.json({
      success: true,
      message: `知识库已存入 Agent：${uploaded.join(', ')}`,
      data: { partition_id: partitionId, files: uploaded }
    });
  } catch (error) {
    console.error('Upload knowledge error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 手动构建 multipart 并上传单个文件到 Agent
async function uploadFileToAgent(agentApi: string, partitionId: string, filePath: string, fileName: string) {
  const buffer = fs.readFileSync(filePath);
  const boundary = '----Boundary' + Math.random().toString(36).slice(2);
  const CRLF = '\r\n';
  const header = Buffer.from(
    `--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}Content-Type: application/octet-stream${CRLF}${CRLF}`
  );
  const footer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
  const body = Buffer.concat([header, buffer, footer]);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    await fetch(`${agentApi}/api/partitions/${partitionId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

// 获取知识库信息（从 Agent 分区查询）
export const getKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM famous_people WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    const celebrityName = rows[0].name || `famous_${id}`;
    const safeName = celebrityName.replace(/[<>:"/\\|?*]/g, '_');
    const partitionId = `famous_${safeName}`;
    const AGENT_API = process.env.AGENT_API || 'http://localhost:8000';

    // 从 Agent API 获取分区文件列表
    let fileList: { name: string; path: string; size: number; type: string }[] = [];
    try {
      const agentRes = await fetch(`${AGENT_API}/api/partitions/${partitionId}/files`);
      if (agentRes.ok) {
        const data = await agentRes.json();
        const agentFiles = data.data?.files || [];
        fileList = agentFiles.map((f: any) => ({
          name: f.name?.startsWith('constraint') ? '约束' : '知识',
          path: `agent://${partitionId}/${f.name}`,
          size: f.size || 0,
          type: f.name?.endsWith('.pdf') ? 'pdf' : 'text'
        }));
      }
    } catch {
      // Agent 不可用时降级到本地文件
      const knowledgeDir = getKnowledgeDir(celebrityName);
      if (fs.existsSync(knowledgeDir)) {
        for (const file of fs.readdirSync(knowledgeDir)) {
          const filePath = path.join(knowledgeDir, file);
          const stat = fs.statSync(filePath);
          const ext = path.extname(file).toLowerCase();
          fileList.push({
            name: file.startsWith('constraint') ? '约束' : '知识',
            path: '/knowledge/' + path.basename(knowledgeDir) + '/' + file,
            size: stat.size,
            type: ['.txt'].includes(ext) ? 'text' : ext === '.pdf' ? 'pdf' : 'other'
          });
        }
      }
    }

    res.json({
      success: true,
      data: { files: fileList, partition_id: partitionId }
    });
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 删除知识库（删除 Agent 分区 + 清理本地残留）
export const deleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM famous_people WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    const celebrityName = rows[0].name || `famous_${id}`;
    const safeName = celebrityName.replace(/[<>:"/\\|?*]/g, '_');
    const partitionId = `famous_${safeName}`;
    const AGENT_API = process.env.AGENT_API || 'http://localhost:8000';

    // 删除 Agent 分区
    let agentDeleted = false;
    try {
      const agentRes = await fetch(`${AGENT_API}/api/partitions/${partitionId}`, { method: 'DELETE' });
      agentDeleted = agentRes.ok;
    } catch {
      console.warn('[Knowledge] Agent 删除分区失败');
    }

    // 清理本地残留的 constraint.txt
    const knowledgeDir = path.join(__dirname, '../../public/knowledge', safeName);
    if (fs.existsSync(knowledgeDir)) {
      fs.rmSync(knowledgeDir, { recursive: true, force: true });
    }

    res.json({
      success: true,
      message: agentDeleted ? '知识库已从 Agent 删除' : '本地知识库已清理'
    });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
