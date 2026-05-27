import { type Request, type Response } from 'express';
import pool from '../config/db.js';
import { type RowDataPacket } from 'mysql2';

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const keyword = req.query.keyword as string;
    const type = (req.query.type as string) || 'all'; // 'effects', 'books', 'all'
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (!keyword) {
      res.json({ success: true, results: { effects: [], books: [] } });
      return;
    }

    const results: any = {};

    if (type === 'all' || type === 'effects') {
      const [effectRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, name, description, 'effect' as type FROM psychological_effects 
         WHERE name LIKE ? OR description LIKE ? 
         LIMIT ? OFFSET ?`,
        [`%${keyword}%`, `%${keyword}%`, limit, offset]
      );
      results.effects = effectRows;
    }

    if (type === 'all' || type === 'books') {
      const [bookRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, title, author, cover_image, 'book' as type FROM books 
         WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? 
         LIMIT ? OFFSET ?`,
        [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, limit, offset]
      );
      results.books = bookRows;
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
