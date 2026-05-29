import { Router } from 'express';
import {
  getFamousPeople,
  getFamousPersonById,
  createFamousPerson,
  updateFamousPerson,
  deleteFamousPerson,
  uploadKnowledge,
  getKnowledge,
  deleteKnowledge
} from '../controllers/famousController.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 知识库文件存储到 Psy_back/public/knowledge/
const knowledgeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tempDir = path.join(__dirname, '../../public/knowledge/_temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[<>:"/\\|?*]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const knowledgeUpload = multer({ storage: knowledgeStorage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', getFamousPeople);
router.get('/:id', getFamousPersonById);
router.post('/', authenticateToken, createFamousPerson);
router.put('/:id', authenticateToken, updateFamousPerson);
router.delete('/:id', authenticateToken, deleteFamousPerson);

// 知识库管理
router.post('/:id/knowledge', authenticateToken, knowledgeUpload.fields([
  { name: 'constraint', maxCount: 1 },
  { name: 'knowledge', maxCount: 1 }
]), uploadKnowledge);
router.get('/:id/knowledge', getKnowledge);
router.delete('/:id/knowledge', authenticateToken, deleteKnowledge);

export default router;
