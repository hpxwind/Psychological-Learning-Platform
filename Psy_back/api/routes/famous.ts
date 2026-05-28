import { Router } from 'express';
import {
  getFamousPeople,
  getFamousPersonById,
  createFamousPerson,
  updateFamousPerson,
  deleteFamousPerson
} from '../controllers/famousController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', getFamousPeople);
router.get('/:id', getFamousPersonById);
router.post('/', authenticateToken, createFamousPerson);
router.put('/:id', authenticateToken, updateFamousPerson);
router.delete('/:id', authenticateToken, deleteFamousPerson);

export default router;
