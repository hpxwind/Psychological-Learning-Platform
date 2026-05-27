import { Router } from 'express';
import { 
  getAllScales, 
  getScaleById, 
  createScale, 
  updateScale, 
  deleteScale,
  getQuestions,
  getReport
} from '../controllers/scaleController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllScales);
router.get('/questions', getQuestions);
router.get('/report', getReport);
router.get('/:id', getScaleById);
router.post('/', createScale);
router.put('/:id', updateScale);
router.delete('/:id', authenticateToken, deleteScale);

export default router;
