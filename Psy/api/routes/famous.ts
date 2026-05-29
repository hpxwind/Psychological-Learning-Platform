import { Router } from 'express';
import { getFamousList, getFamousById, createFamous, updateFamous, deleteFamous, uploadKnowledge, getKnowledge, deleteKnowledge } from '../controllers/famousController.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 知识库文件存储配置
const knowledgeStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // 动态目录在控制器中处理，这里先用临时目录
    const tempDir = path.join(__dirname, '../../public/knowledge/_temp');
    const fs = require('fs');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    // 保持原始文件名
    const safeName = file.originalname.replace(/[<>:"/\\|?*]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const knowledgeUpload = multer({ storage: knowledgeStorage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', getFamousList);
router.get('/:id', getFamousById);
router.post('/', authenticateToken, createFamous);
router.put('/:id', authenticateToken, updateFamous);
router.delete('/:id', authenticateToken, deleteFamous);

// 知识库管理
router.post('/:id/knowledge', authenticateToken, knowledgeUpload.fields([
  { name: 'constraint', maxCount: 1 },
  { name: 'knowledge', maxCount: 1 }
]), uploadKnowledge);
router.get('/:id/knowledge', getKnowledge);
router.delete('/:id/knowledge', authenticateToken, deleteKnowledge);

export default router;
