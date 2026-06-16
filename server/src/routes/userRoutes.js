import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getMe, updateMe, deleteMe, onboarding } from '../controllers/userController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/me', getMe);
router.put('/me', updateMe);
router.delete('/me', deleteMe);
router.post('/onboarding', onboarding);

export default router;
