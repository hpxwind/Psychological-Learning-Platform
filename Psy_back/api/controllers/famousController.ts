import { type Request, type Response } from 'express';
import pool from '../config/db.js';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

// 获取名人列表
export const getFamousPeople = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;

    let query = 'SELECT id, name, introduction, life_story, works, photo, status_idle, status_listening, status_thinking, status_answered, created_at, updated_at FROM famous_people';
    const params: any[] = [];

    if (keyword) {
      query += ' WHERE name LIKE ?';
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

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

    res.json({ success: true, data: rows[0] });
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
      photo, status_idle, status_listening, status_thinking, status_answered
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: '姓名不能为空' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO famous_people (name, introduction, life_story, works, photo, status_idle, status_listening, status_thinking, status_answered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, introduction || '', life_story || '', works || '', photo || '', status_idle || '', status_listening || '', status_thinking || '', status_answered || '']
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

    await pool.query(
      `UPDATE famous_people SET
        name = ?, introduction = ?, life_story = ?, works = ?,
        photo = ?, status_idle = ?, status_listening = ?, status_thinking = ?, status_answered = ?
       WHERE id = ?`,
      [name, introduction || '', life_story || '', works || '', photo || '', status_idle || '', status_listening || '', status_thinking || '', status_answered || '', id]
    );

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

    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM famous_people WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: '未找到该名人' });
      return;
    }

    await pool.query('DELETE FROM famous_people WHERE id = ?', [id]);
    res.json({ success: true, message: '名人删除成功' });
  } catch (error) {
    console.error('Delete famous person error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
