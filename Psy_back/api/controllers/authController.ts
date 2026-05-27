import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { type RowDataPacket } from 'mysql2';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM admins WHERE username = ?', [username]);

    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
