import * as analyticsService from './analyticsService.js';
import { handleRouteError } from '../../shared/errors/handler.js';

export const getAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.fetchAnalyticsData(req.user.userId, req.query);
    res.json(data);
  } catch (error) {
    if (error.message.includes('Custom period requires') || error.message.includes('Invalid dates') || error.message.includes('Start date cannot')) {
      return res.status(400).json({ error: error.message });
    }
    return handleRouteError(res, error, 'Analytics calculation');
  }
};

export const getFinancialHealth = async (req, res) => {
  try {
    const health = await analyticsService.fetchFinancialHealthScore(req.user.userId, req.query);
    res.json(health);
  } catch (error) {
    if (error.message.includes('Custom period requires') || error.message.includes('Invalid dates') || error.message.includes('Start date cannot')) {
      return res.status(400).json({ error: error.message });
    }
    return handleRouteError(res, error, 'Financial Health Score');
  }
};

export const getAnomalies = async (req, res) => {
  try {
    const list = await analyticsService.fetchAnomalies(req.user.userId);
    res.json(list);
  } catch (error) {
    return handleRouteError(res, error, 'Anomalies fetch');
  }
};
