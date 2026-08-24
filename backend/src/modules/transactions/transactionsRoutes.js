import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { validateBody } from '../../shared/middleware/validation.js';
import * as transactionsController from './transactionsController.js';

const router = express.Router();

const transactionSchema = {
  amount: { required: true, type: 'number', positive: true },
  type: { required: true, enum: ['income', 'expense'] },
  date: { required: true, regex: /^\d{4}-\d{2}-\d{2}$/ }
};

const transactionUpdateSchema = {
  amount: { type: 'number', positive: true },
  type: { enum: ['income', 'expense'] },
  date: { regex: /^\d{4}-\d{2}-\d{2}$/ }
};

router.get('/transactions', authenticateToken, transactionsController.listTransactions);
router.get('/transactions/export', authenticateToken, transactionsController.exportTransactions);
router.post('/transactions/import/preview', authenticateToken, transactionsController.previewImport);
router.post('/transactions/import/confirm', authenticateToken, transactionsController.confirmImport);
router.post('/transactions', authenticateToken, validateBody(transactionSchema), transactionsController.createTransaction);
router.put('/transactions/:id', authenticateToken, validateBody(transactionUpdateSchema), transactionsController.updateTransaction);
router.delete('/transactions/:id', authenticateToken, transactionsController.deleteTransaction);

export default router;
