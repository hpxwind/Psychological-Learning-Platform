import { type Request, type Response } from 'express';
import pool from '../config/db.js';
import { type RowDataPacket, type ResultSetHeader } from 'mysql2';

const normalizeDateToMysqlDate = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

const normalizeUrl = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  let v = value.trim();
  if (!v) return null;
  v = v.replace(/^`+|`+$/g, '').trim();
  v = v.replace(/^"+|"+$/g, '').trim();
  v = v.replace(/^'+|'+$/g, '').trim();
  return v || null;
};

// 获取图书列表
export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;

    let query = 'SELECT * FROM books';
    const params: any[] = [];

    if (keyword) {
      query += ' WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM books';
    const countParams: any[] = [];
    if (keyword) {
      countQuery += ' WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      success: true,
      books: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 获取图书详情
export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE id = ?', [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    const book = rows[0];
    const [summaryRows] = await pool.query<RowDataPacket[]>('SELECT summary_content FROM book_summaries WHERE book_id = ?', [id]);
    
    if (summaryRows.length > 0) {
      book.summary = summaryRows[0].summary_content;
    }

    res.json({ success: true, book });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 创建图书
export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, author, isbn, publisher, publish_date, cover_image, ebook_url, summary } = req.body;
    const normalizedPublishDate = normalizeDateToMysqlDate(publish_date);
    if (!normalizedPublishDate) {
      res.status(400).json({ success: false, message: 'Invalid publish_date. Expected YYYY-MM-DD.' });
      return;
    }
    const normalizedEbookUrl = normalizeUrl(ebook_url);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO books (title, author, isbn, publisher, publish_date, cover_image, ebook_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, author, isbn, publisher, normalizedPublishDate, cover_image, normalizedEbookUrl]
    );

    const bookId = result.insertId;

    if (summary) {
      await pool.query(
        'INSERT INTO book_summaries (book_id, summary_content) VALUES (?, ?)',
        [bookId, JSON.stringify(summary)]
      );
    }

    res.status(201).json({ success: true, message: 'Book created', id: bookId });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 更新图书
export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, author, isbn, publisher, publish_date, cover_image, ebook_url, summary } = req.body;
    const normalizedPublishDate = normalizeDateToMysqlDate(publish_date);
    if (!normalizedPublishDate) {
      res.status(400).json({ success: false, message: 'Invalid publish_date. Expected YYYY-MM-DD.' });
      return;
    }
    const normalizedEbookUrl = normalizeUrl(ebook_url);

    await pool.query(
      'UPDATE books SET title = ?, author = ?, isbn = ?, publisher = ?, publish_date = ?, cover_image = ?, ebook_url = ? WHERE id = ?',
      [title, author, isbn, publisher, normalizedPublishDate, cover_image, normalizedEbookUrl, id]
    );

    if (summary) {
      // 检查是否存在简介
      const [existingSummary] = await pool.query<RowDataPacket[]>('SELECT id FROM book_summaries WHERE book_id = ?', [id]);
      
      if (existingSummary.length > 0) {
        await pool.query(
          'UPDATE book_summaries SET summary_content = ? WHERE book_id = ?',
          [JSON.stringify(summary), id]
        );
      } else {
        await pool.query(
          'INSERT INTO book_summaries (book_id, summary_content) VALUES (?, ?)',
          [id, JSON.stringify(summary)]
        );
      }
    }

    res.json({ success: true, message: 'Book updated' });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 删除图书
export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM books WHERE id = ?', [id]);
    res.json({ success: true, message: 'Book deleted' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
