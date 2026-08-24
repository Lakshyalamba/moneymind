import * as budgetsService from './budgetsService.js';
import { checkAndGenerateAlerts } from '../notifications/notificationsService.js';
import { handleRouteError } from '../../shared/errors/handler.js';

export const getBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const formatted = await budgetsService.fetchBudgetsWithForecast(userId);

    // Fire alert checks in background
    checkAndGenerateAlerts(userId).catch(e => console.error('Alert engine failed:', e.message));

    res.json(formatted);
  } catch (error) {
    return handleRouteError(res, error, 'Budgets fetch');
  }
};

export const createBudget = async (req, res) => {
  try {
    const budget = await budgetsService.createOrUpdateBudget(req.user.userId, req.body);
    res.status(201).json(budget);
  } catch (error) {
    return handleRouteError(res, error, 'Budget creation');
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const deleted = await budgetsService.deleteBudget(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Budget delete');
  }
};
