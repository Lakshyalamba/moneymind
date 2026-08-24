import * as transactionsService from './transactionsService.js';
import { handleRouteError } from '../../shared/errors/handler.js';

export const listTransactions = async (req, res) => {
  try {
    const result = await transactionsService.fetchTransactions(req.user.userId, req.query);
    res.json(result);
  } catch (error) {
    return handleRouteError(res, error, 'Transactions fetch');
  }
};

export const createTransaction = async (req, res) => {
  try {
    const transaction = await transactionsService.createTransaction(req.user.userId, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    return handleRouteError(res, error, 'Transaction creation');
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const updated = await transactionsService.updateTransaction(req.params.id, req.user.userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Transaction update');
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const deleted = await transactionsService.deleteTransaction(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Transaction delete');
  }
};
