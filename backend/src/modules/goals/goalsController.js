import * as goalsService from './goalsService.js';
import { handleRouteError } from '../../shared/errors/handler.js';

export const listGoals = async (req, res) => {
  try {
    const goals = await goalsService.fetchGoals(req.user.userId);
    res.json(goals);
  } catch (error) {
    return handleRouteError(res, error, 'Goals fetch');
  }
};

export const createGoal = async (req, res) => {
  try {
    const goal = await goalsService.createGoal(req.user.userId, req.body);
    res.status(201).json(goal);
  } catch (error) {
    return handleRouteError(res, error, 'Goal creation');
  }
};

export const updateGoal = async (req, res) => {
  try {
    const updated = await goalsService.updateGoal(req.params.id, req.user.userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Goal update');
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const deleted = await goalsService.deleteGoal(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Goal delete');
  }
};
