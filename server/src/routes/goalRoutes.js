import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  listGoals,
  createGoal,
  updateGoal,
  deleteGoal
} from '../controllers/goalController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', listGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
