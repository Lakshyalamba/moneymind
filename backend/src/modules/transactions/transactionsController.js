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

export const exportTransactions = async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const content = await transactionsService.exportTransactionsData(req.user.userId, format);
    
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().slice(0,10)}.${format}"`);
    res.send(content);
  } catch (error) {
    return handleRouteError(res, error, 'Transactions export');
  }
};

export const previewImport = async (req, res) => {
  try {
    const { format, content } = req.body;
    if (!format || !content) {
      return res.status(400).json({ error: 'Format and file content are required' });
    }
    const preview = await transactionsService.previewImportData(req.user.userId, format, content);
    res.json(preview);
  } catch (error) {
    return handleRouteError(res, error, 'Transactions import preview');
  }
};

export const confirmImport = async (req, res) => {
  try {
    const { transactions } = req.body;
    const result = await transactionsService.confirmImportTransactions(req.user.userId, transactions);
    res.status(201).json({
      message: `Imported ${result.length} transactions successfully`,
      count: result.length
    });
  } catch (error) {
    return handleRouteError(res, error, 'Transactions import confirm');
  }
};
