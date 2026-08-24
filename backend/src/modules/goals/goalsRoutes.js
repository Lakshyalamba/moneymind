import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { validateBody } from '../../shared/middleware/validation.js';
import * as goalsController from './goalsController.js';

const router = express.Router();

const goalSchema = {
  title: { required: true },
  targetAmount: { required: true, type: 'number', positive: true },
  deadline: { required: true, regex: /^\d{4}-\d{2}-\d{2}$/ }
};

const goalUpdateSchema = {
  targetAmount: { type: 'number', positive: true },
  deadline: { regex: /^\d{4}-\d{2}-\d{2}$/ }
};

router.get('/goals', authenticateToken, goalsController.listGoals);
router.post('/goals', authenticateToken, validateBody(goalSchema), goalsController.createGoal);
router.put('/goals/:id', authenticateToken, validateBody(goalUpdateSchema), goalsController.updateGoal);
router.delete('/goals/:id', authenticateToken, goalsController.deleteGoal);

export default router;
