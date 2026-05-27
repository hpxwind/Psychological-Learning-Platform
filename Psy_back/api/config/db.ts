import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 确保在 ESM 模式下也能正确加载 .env（虽然 app.ts 可能已经加载了，但这里独立加载更安全）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'psychology_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
