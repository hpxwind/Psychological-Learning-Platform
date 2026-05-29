import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'psychology_db',
  });

  const columns = [
    { name: 'theory', after: 'works', comment: '理论思想' },
    { name: 'influence', after: 'theory', comment: '人物影响' },
    { name: 'evaluation', after: 'influence', comment: '人物评价' },
    { name: 'published_books', after: 'evaluation', comment: '出版图书' },
    { name: 'gallery', after: 'published_books', comment: '图片集(JSON数组)' },
  ];

  for (const col of columns) {
    try {
      await pool.query(
        `ALTER TABLE famous_people ADD COLUMN ${col.name} TEXT COMMENT '${col.comment}' AFTER ${col.after}`
      );
      console.log(`✓ ${col.name} column added`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`- ${col.name} already exists, skip`);
      } else {
        console.error(`✗ ${col.name} error:`, e.message);
      }
    }
  }

  await pool.end();
  console.log('Done.');
}

run();
