import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', listCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
