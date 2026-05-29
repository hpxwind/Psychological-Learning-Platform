import { type Request, type Response } from 'express';
import pool from '../config/db.js';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

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
    // 按原始顺序排列
    const bookMap = new Map<number, any>();
    for (const b of bookRows) bookMap.set(b.id, b);
    return ids.map(id => bookMap.get(id) || { id, title: '未知图书', cover_image: '' });
  } catch {
    return [];
  }
}

// 获取名人列表
export const getFamousList = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM famous_people ORDER BY id ASC LIMIT ? OFFSET ?',
      [limit, offset]
    );

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

    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM famous_people'
    );
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
    console.error('Get famous list error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 获取单个名人详情
export const getFamousById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM famous_people WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Celebrity not found' });
      return;
    }

    const data = rows[0];
    data.published_books_detail = await resolvePublishedBooks(data.published_books);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get famous by id error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 创建名人
export const createFamous = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, introduction, life_story, works, theory, influence, evaluation, published_books, gallery, photo, status_idle, status_listening, status_thinking, status_answered } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    // published_books 接收书ID数组，转为JSON字符串存储
    const publishedBooksStr = Array.isArray(published_books) ? JSON.stringify(published_books) : (published_books || '');

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO famous_people (name, introduction, life_story, works, theory, influence, evaluation, published_books, gallery, photo, status_idle, status_listening, status_thinking, status_answered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, introduction || '', life_story || '', works || '', theory || '', influence || '', evaluation || '', publishedBooksStr, gallery || '', photo || '', status_idle || '', status_listening || '', status_thinking || '', status_answered || '']
    );

    res.status(201).json({ success: true, message: 'Celebrity created', id: result.insertId });
  } catch (error) {
    console.error('Create famous error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 更新名人
export const updateFamous = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, introduction, life_story, works, theory, influence, evaluation, published_books, gallery, photo, status_idle, status_listening, status_thinking, status_answered } = req.body;

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM famous_people WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Celebrity not found' });
      return;
    }

    // 只更新提供的字段
    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (introduction !== undefined) { fields.push('introduction = ?'); values.push(introduction); }
    if (life_story !== undefined) { fields.push('life_story = ?'); values.push(life_story); }
    if (works !== undefined) { fields.push('works = ?'); values.push(works); }
    if (theory !== undefined) { fields.push('theory = ?'); values.push(theory); }
    if (influence !== undefined) { fields.push('influence = ?'); values.push(influence); }
    if (evaluation !== undefined) { fields.push('evaluation = ?'); values.push(evaluation); }
    if (published_books !== undefined) {
      fields.push('published_books = ?');
      values.push(Array.isArray(published_books) ? JSON.stringify(published_books) : published_books);
    }
    if (gallery !== undefined) { fields.push('gallery = ?'); values.push(gallery); }
    if (photo !== undefined) { fields.push('photo = ?'); values.push(photo); }
    if (status_idle !== undefined) { fields.push('status_idle = ?'); values.push(status_idle); }
    if (status_listening !== undefined) { fields.push('status_listening = ?'); values.push(status_listening); }
    if (status_thinking !== undefined) { fields.push('status_thinking = ?'); values.push(status_thinking); }
    if (status_answered !== undefined) { fields.push('status_answered = ?'); values.push(status_answered); }

    if (fields.length === 0) {
      res.json({ success: true, message: 'Nothing to update' });
      return;
    }

    values.push(id);
    const sql = `UPDATE famous_people SET ${fields.join(', ')} WHERE id = ?`;
    console.log('[updateFamous] SQL:', sql);
    console.log('[updateFamous] values:', JSON.stringify(values));
    const [updateResult] = await pool.query<ResultSetHeader>(sql, values);
    console.log('[updateFamous] affectedRows:', updateResult.affectedRows);

    res.json({ success: true, message: 'Celebrity updated' });
  } catch (error) {
    console.error('Update famous error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 删除名人
export const deleteFamous = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM famous_people WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Celebrity not found' });
      return;
    }

    await pool.query('DELETE FROM famous_people WHERE id = ?', [id]);
    res.json({ success: true, message: 'Celebrity deleted' });
  } catch (error) {
    console.error('Delete famous error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== 知识库管理 ====================

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取名人的知识库目录
function getKnowledgeDir(nameOrId: string): string {
  const safeName = nameOrId.replace(/[<>:"/\\|?*]/g, '_');
  const dir = path.join(__dirname, '../../public/knowledge', safeName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// 上传知识库文件
export const uploadKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 查找名人信息以获取名称
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM famous_people WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Celebrity not found' });
      return;
    }

    const celebrityName = rows[0].name || `famous_${id}`;
    const knowledgeDir = getKnowledgeDir(celebrityName);

    const result: { constraint?: string; knowledge?: string } = {};

    // 处理约束文件
    if (files.constraint && files.constraint.length > 0) {
      const file = files.constraint[0];
      const destPath = path.join(knowledgeDir, 'constraint.txt');
      fs.copyFileSync(file.path, destPath);
      fs.unlinkSync(file.path); // 删除临时文件
      result.constraint = '/knowledge/' + path.basename(knowledgeDir) + '/constraint.txt';
    }

    // 处理知识文件
    if (files.knowledge && files.knowledge.length > 0) {
      const file = files.knowledge[0];
      // 保留原始扩展名
      const ext = path.extname(file.originalname) || '.txt';
      const destPath = path.join(knowledgeDir, `knowledge${ext}`);
      fs.copyFileSync(file.path, destPath);
      fs.unlinkSync(file.path); // 删除临时文件
      result.knowledge = '/knowledge/' + path.basename(knowledgeDir) + `/knowledge${ext}`;
    }

    // 同步到 Agent 分区
    try {
      const safeName = celebrityName.replace(/[<>:"/\\|?*]/g, '_');
      const partitionId = `famous_${safeName}`;

      // 创建 Agent 分区
      await fetch(`http://localhost:8000/api/partitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partitionId, name: celebrityName, description: `${celebrityName}的知识库` })
      }).catch(() => {});

      // 上传文件到 Agent
      for (const field of ['constraint', 'knowledge'] as const) {
        if (files[field] && files[field].length > 0) {
          const filePath = path.join(knowledgeDir, field === 'constraint' ? 'constraint.txt' : `knowledge${path.extname(files[field][0].originalname) || '.txt'}`);
          const { default: FormDataNode } = await import('form-data');
          const { createReadStream } = await import('fs');
          const form = new FormDataNode();
          // 直接发送文件路径给 agent，agent 会复制到分区
          // 由于 agent upload API 接受文件上传，我们需要用 multipart
          const nodeFetch = (await import('node-fetch')).default;
          const blob = fs.readFileSync(filePath);
          const agentForm = new FormDataNode();
          agentForm.append('file', blob, path.basename(filePath));
          await nodeFetch(`http://localhost:8000/api/partitions/${partitionId}/files`, {
            method: 'POST',
            body: agentForm,
            headers: agentForm.getHeaders()
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[Knowledge] Agent sync warning:', err);
    }

    res.json({
      success: true,
      message: '知识库上传成功',
      data: result
    });
  } catch (error) {
    console.error('Upload knowledge error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 获取知识库信息
export const getKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM famous_people WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Celebrity not found' });
      return;
    }

    const celebrityName = rows[0].name || `famous_${id}`;
    const knowledgeDir = getKnowledgeDir(celebrityName);

    const files: { name: string; path: string; size: number; type: string }[] = [];
    if (fs.existsSync(knowledgeDir)) {
      for (const file of fs.readdirSync(knowledgeDir)) {
        const filePath = path.join(knowledgeDir, file);
        const stat = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        files.push({
          name: file.startsWith('constraint') ? '约束' : '知识',
          path: '/knowledge/' + path.basename(knowledgeDir) + '/' + file,
          size: stat.size,
          type: ['.txt'].includes(ext) ? 'text' : ext === '.pdf' ? 'pdf' : 'other'
        });
      }
    }

    res.json({
      success: true,
      data: { files, knowledgeDir }
    });
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 删除知识库
export const deleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM famous_people WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Celebrity not found' });
      return;
    }

    const celebrityName = rows[0].name || `famous_${id}`;
    const knowledgeDir = getKnowledgeDir(celebrityName);

    // 删除本地文件
    if (fs.existsSync(knowledgeDir)) {
      fs.rmSync(knowledgeDir, { recursive: true, force: true });
    }

    // 删除 Agent 分区
    try {
      const safeName = celebrityName.replace(/[<>:"/\\|?*]/g, '_');
      await fetch(`http://localhost:8000/api/partitions/famous_${safeName}`, {
        method: 'DELETE'
      }).catch(() => {});
    } catch {}

    res.json({ success: true, message: '知识库已删除' });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
