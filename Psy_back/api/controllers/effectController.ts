import { type Request, type Response } from 'express';
import pool from '../config/db.js';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

// 获取每日效应
export const getDailyEffect = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    
    // 首先尝试获取今天的每日效应
    let [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, d.display_date 
       FROM daily_effects d 
       JOIN psychological_effects e ON d.effect_id = e.id 
       WHERE d.display_date = ?`,
      [today]
    );

    // 如果今天没有设置，则随机选择一个并设置为今天的（或者返回最新的一个）
    if (rows.length === 0) {
      // 简单起见，这里我们只查询最新的一个效应作为 fallback，实际逻辑可以是随机选取
      const [fallbackRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM psychological_effects ORDER BY created_at DESC LIMIT 1'
      );
      
      if (fallbackRows.length > 0) {
        rows = fallbackRows;
        // 可以在这里插入到 daily_effects 表，但这取决于业务逻辑
      }
    }

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'No effects found' });
      return;
    }

    const effect = rows[0];
    // 获取关联的媒体文件
    const [mediaRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM effect_media WHERE effect_id = ?',
      [effect.id]
    );
    effect.media = mediaRows;

    res.json({ success: true, effect });
  } catch (error) {
    console.error('Get daily effect error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 获取效应列表
export const getEffects = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;

    let query = 'SELECT * FROM psychological_effects';
    const params: any[] = [];

    if (keyword) {
      query += ' WHERE name LIKE ? OR description LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM psychological_effects';
    const countParams: any[] = [];
    if (keyword) {
      countQuery += ' WHERE name LIKE ? OR description LIKE ?';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      success: true,
      effects: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get effects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 获取效应详情
export const getEffectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM psychological_effects WHERE id = ?', [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Effect not found' });
      return;
    }

    const effect = rows[0];
    const [mediaRows] = await pool.query<RowDataPacket[]>('SELECT * FROM effect_media WHERE effect_id = ?', [id]);
    effect.media = mediaRows;

    res.json({ success: true, effect });
  } catch (error) {
    console.error('Get effect error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 创建效应
export const createEffect = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, proposer, description, experiment_detail, explanation, images, videos } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO psychological_effects (name, proposer, description, experiment_detail, explanation) VALUES (?, ?, ?, ?, ?)',
      [name, proposer, description, JSON.stringify(experiment_detail), explanation]
    );

    const effectId = result.insertId;

    // 插入媒体文件
    if (images && Array.isArray(images)) {
      for (const url of images) {
        await pool.query('INSERT INTO effect_media (effect_id, media_type, file_url) VALUES (?, ?, ?)', [effectId, 'image', url]);
      }
    }
    if (videos && Array.isArray(videos)) {
      for (const url of videos) {
        await pool.query('INSERT INTO effect_media (effect_id, media_type, file_url) VALUES (?, ?, ?)', [effectId, 'video', url]);
      }
    }

    res.status(201).json({ success: true, message: 'Effect created', id: effectId });
  } catch (error) {
    console.error('Create effect error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 更新效应
export const updateEffect = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, proposer, description, experiment_detail, explanation, images, videos } = req.body;

    await pool.query(
      'UPDATE psychological_effects SET name = ?, proposer = ?, description = ?, experiment_detail = ?, explanation = ? WHERE id = ?',
      [name, proposer, description, JSON.stringify(experiment_detail), explanation, id]
    );

    // Handle media updates: Delete existing and re-insert
    if (images || videos) {
      await pool.query('DELETE FROM effect_media WHERE effect_id = ?', [id]);

      if (images && Array.isArray(images)) {
        for (const url of images) {
          if (url) {
             await pool.query('INSERT INTO effect_media (effect_id, media_type, file_url) VALUES (?, ?, ?)', [id, 'image', url]);
          }
        }
      }
      if (videos && Array.isArray(videos)) {
        for (const url of videos) {
           if (url) {
            await pool.query('INSERT INTO effect_media (effect_id, media_type, file_url) VALUES (?, ?, ?)', [id, 'video', url]);
           }
        }
      }
    }

    res.json({ success: true, message: 'Effect updated' });
  } catch (error) {
    console.error('Update effect error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 删除效应
export const deleteEffect = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM psychological_effects WHERE id = ?', [id]);
    res.json({ success: true, message: 'Effect deleted' });
  } catch (error) {
    console.error('Delete effect error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
