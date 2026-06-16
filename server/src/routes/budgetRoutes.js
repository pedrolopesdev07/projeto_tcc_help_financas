import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', listBudgets);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
