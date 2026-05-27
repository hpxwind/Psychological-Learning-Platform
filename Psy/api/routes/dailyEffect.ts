import { Router } from 'express';
import { getDailyEffect } from '../controllers/effectController.js';

const router = Router();

router.get('/', getDailyEffect);

export default router;
