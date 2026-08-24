import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import * as analyticsController from './analyticsController.js';

const router = express.Router();

router.get('/analytics', authenticateToken, analyticsController.getAnalytics);
router.get('/analytics/financial-health', authenticateToken, analyticsController.getFinancialHealth);
router.get('/analytics/anomalies', authenticateToken, analyticsController.getAnomalies);

export default router;
