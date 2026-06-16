import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} from '../controllers/transactionController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', listTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.get('/summary', getSummary);

export default router;
