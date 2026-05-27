import { Router } from 'express';
import { getEffects, getEffectById, createEffect, updateEffect, deleteEffect } from '../controllers/effectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', getEffects);
router.get('/:id', getEffectById);
router.post('/', authenticateToken, createEffect);
router.put('/:id', authenticateToken, updateEffect);
router.delete('/:id', authenticateToken, deleteEffect);

export default router;
