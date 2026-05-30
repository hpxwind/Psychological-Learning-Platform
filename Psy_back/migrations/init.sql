CREATE DATABASE IF NOT EXISTS psychology_db;
USE psychology_db;

CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 初始化管理员数据 (如果不存在)
INSERT IGNORE INTO admins (username, password_hash) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- 密码: password

CREATE TABLE IF NOT EXISTS psychological_effects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    proposer VARCHAR(100) NOT NULL,
    description TEXT,
    experiment_detail JSON,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_proposer (proposer)
);

CREATE TABLE IF NOT EXISTS effect_media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    effect_id INT NOT NULL,
    media_type ENUM('image', 'video') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    original_name VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (effect_id) REFERENCES psychological_effects(id) ON DELETE CASCADE,
    INDEX idx_effect_id (effect_id)
);

CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    publisher VARCHAR(100) NOT NULL,
    publish_date DATE NOT NULL,
    cover_image VARCHAR(500),
    ebook_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_author (author)
);

CREATE TABLE IF NOT EXISTS book_summaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    summary_content JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uk_book_id (book_id)
);

CREATE TABLE IF NOT EXISTS daily_effects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    effect_id INT NOT NULL,
    display_date DATE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (effect_id) REFERENCES psychological_effects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_display_date (display_date),
    INDEX idx_effect_id (effect_id),
    INDEX idx_display_date (display_date)
);

-- 初始化示例数据
-- 插入一个心理学效应 (如果不存在)
INSERT INTO psychological_effects (name, proposer, description, experiment_detail, explanation) 
SELECT '吊桥效应', '阿瑟·阿伦 (Arthur Aron)', '当一个人提心吊胆地过吊桥的时候，会不由自主地心跳加快。如果这个时候，碰巧遇见一个异性，那么他会错把由这种情境引起的心跳加快理解为对方使自己心动，才产生的生理反应，故而对对方滋生出爱情的情愫。', 
'{"title": "卡皮拉诺吊桥实验", "content": "1974年，阿瑟·阿伦在温哥华的卡皮拉诺吊桥上进行实验。一位漂亮的女助手分别在吊桥和一座坚固的木桥上对男性进行问卷调查，并留下电话号码。结果显示，吊桥上的男性更有可能给女助手打电话，并认为她更有吸引力。"}', 
'这种现象被称为“生理唤醒的错误归因”。人们在情绪激动（如恐惧、兴奋）时，生理唤醒水平提高，如果此时有异性在场，人们容易将这种生理唤醒错误地归因于对异性的吸引力。'
WHERE NOT EXISTS (SELECT 1 FROM psychological_effects WHERE name = '吊桥效应');

-- 设置今日展示 (注意：这里使用 ID=1 可能会有问题，如果在生产环境中 ID 不确定。但在初始化脚本中通常没问题)
-- 为防止重复插入，使用 REPLACE 或 ON DUPLICATE KEY UPDATE
INSERT INTO daily_effects (effect_id, display_date, is_featured) 
SELECT 1, CURDATE(), TRUE
WHERE NOT EXISTS (SELECT 1 FROM daily_effects WHERE display_date = CURDATE());

-- 插入一本书籍
INSERT INTO books (title, author, isbn, publisher, publish_date, cover_image, ebook_url)
SELECT '思考，快与慢', '丹尼尔·卡尼曼', '9787508633558', '中信出版社', '2012-07-01', 'https://img9.doubanio.com/view/subject/l/public/s10743936.jpg', 'https://example.com/ebook/thinking-fast-and-slow.pdf'
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9787508633558');

INSERT INTO book_summaries (book_id, summary_content)
SELECT 1, '{"intro": "本书主要介绍了大脑的两种思维模式：系统1（快思考）和系统2（慢思考）。", "highlights": ["前景理论", "锚定效应", "可得性启发法"]}'
WHERE NOT EXISTS (SELECT 1 FROM book_summaries WHERE book_id = 1);
