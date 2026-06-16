import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { monthlyReport, compareReport, exportReport } from '../controllers/reportController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/monthly', monthlyReport);
router.get('/compare', compareReport);
router.get('/export', exportReport);

export default router;
