-- 名人管理表
CREATE TABLE IF NOT EXISTS famous_people (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name TEXT NOT NULL COMMENT '姓名（MD格式）',
    introduction TEXT COMMENT '简介（MD格式）',
    life_story TEXT COMMENT '生平（MD格式）',
    works TEXT COMMENT '著作（MD格式）',
    photo VARCHAR(500) COMMENT '照片URL',
    status_idle VARCHAR(500) COMMENT '状态照片-没有动作',
    status_listening VARCHAR(500) COMMENT '状态照片-聆听',
    status_thinking VARCHAR(500) COMMENT '状态照片-思考',
    status_answered VARCHAR(500) COMMENT '状态照片-思考出答案',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
