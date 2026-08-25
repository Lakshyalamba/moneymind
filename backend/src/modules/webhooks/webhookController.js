import * as webhookService from './webhookService.js';
import { handleRouteError } from '../../shared/errors/handler.js';

export const listWebhooks = async (req, res) => {
  try {
    const list = await webhookService.listSubscriptions(req.user.userId);
    res.json(list);
  } catch (error) {
    return handleRouteError(res, error, 'Webhook list');
  }
};

export const createWebhook = async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'url and events array are required' });
    }
    const created = await webhookService.createSubscription(req.user.userId, { url, events, secret });
    res.status(201).json(created);
  } catch (error) {
    return handleRouteError(res, error, 'Webhook creation');
  }
};

export const updateWebhook = async (req, res) => {
  try {
    const updated = await webhookService.updateSubscription(req.params.id, req.user.userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Webhook subscription not found' });
    }
    res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Webhook update');
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    const deleted = await webhookService.deleteSubscription(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Webhook subscription not found' });
    }
    res.json({ message: 'Webhook subscription deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Webhook deletion');
  }
};
