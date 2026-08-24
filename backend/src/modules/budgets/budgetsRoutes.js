import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { validateBody } from '../../shared/middleware/validation.js';
import * as budgetsController from './budgetsController.js';

const router = express.Router();

const budgetSchema = {
  category: { required: true },
  limit: { required: true, type: 'number', positive: true }
};

router.get('/budgets', authenticateToken, budgetsController.getBudgets);
router.post('/budgets', authenticateToken, validateBody(budgetSchema), budgetsController.createBudget);
router.delete('/budgets/:id', authenticateToken, budgetsController.deleteBudget);

export default router;
