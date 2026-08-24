import * as subscriptionsService from './subscriptionsService.js';
import { handleRouteError } from '../../shared/errors/handler.js';

export const listRecurring = async (req, res) => {
  try {
    const formatted = await subscriptionsService.fetchRecurring(req.user.userId, req.query.isSubscription);
    res.json(formatted);
  } catch (error) {
    return handleRouteError(res, error, 'Recurring fetch');
  }
};

export const createRecurring = async (req, res) => {
  try {
    const { name, amount, type, category, frequency, startDate } = req.body;
    if (!name || !amount || parseFloat(amount) <= 0 || !type || !category || !frequency || !startDate) {
      return res.status(400).json({ error: 'Missing or invalid required parameters' });
    }

    const item = await subscriptionsService.createRecurring(req.user.userId, req.body);
    res.status(201).json(item);
  } catch (error) {
    return handleRouteError(res, error, 'Recurring creation');
  }
};

export const updateRecurring = async (req, res) => {
  try {
    const updated = await subscriptionsService.updateRecurring(req.params.id, req.user.userId, req.body);
    res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Recurring update');
  }
};

export const deleteRecurring = async (req, res) => {
  try {
    const deleted = await subscriptionsService.deleteRecurring(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    res.json({ message: 'Recurring transaction deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Recurring delete');
  }
};

export const processRecurring = async (req, res) => {
  try {
    const { date } = req.body;
    const generated = await subscriptionsService.processRecurringTransactions(req.user.userId, date);
    
    res.json({
      message: `Processed due occurrences. Generated ${generated.length} actual transactions.`,
      generatedCount: generated.length,
      transactions: generated.map(t => ({
        ...t,
        amount: parseFloat(t.amount)
      }))
    });
  } catch (error) {
    return handleRouteError(res, error, 'Recurring process');
  }
};
