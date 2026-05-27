import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123.com.cn',
  database: process.env.DB_NAME || 'psychology_db',
});

async function fixBooks() {
  const conn = await pool.getConnection();
  try {
    // 删除多余的图书 (id=4, 5, 6)
    await conn.query('DELETE FROM book_summaries WHERE book_id IN (4, 5, 6)');
    await conn.query('DELETE FROM books WHERE id IN (4, 5, 6)');
    console.log('✓ 已删除多余的图书(id=4,5,6)');
    
    // 更新豆瓣链接
    const doubanUrls: Record<number, string> = {
      1: 'https://book.douban.com/subject/33444912/',
      2: 'https://book.douban.com/subject/1786387/',
      3: 'https://book.douban.com/subject/1002422/'
    };
    
    for (const [id, url] of Object.entries(doubanUrls)) {
      await conn.query('UPDATE books SET ebook_url = ? WHERE id = ?', [url, parseInt(id)]);
      console.log(`✓ 已更新书籍id=${id}的豆瓣链接`);
    }
    
    console.log('\n操作完成！刷新页面查看效果。');
  } finally {
    conn.release();
    await pool.end();
  }
}

fixBooks();
