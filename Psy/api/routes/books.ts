import { Router } from 'express';
import { getBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/bookController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', authenticateToken, createBook);
router.put('/:id', authenticateToken, updateBook);
router.delete('/:id', authenticateToken, deleteBook);

export default router;
