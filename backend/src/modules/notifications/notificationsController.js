import * as notificationsService from './notificationsService.js';
import { handleRouteError } from '../../shared/errors/handler.js';

export const getNotifications = async (req, res) => {
  try {
    const list = await notificationsService.fetchNotifications(req.user.userId);
    res.json(list);
  } catch (error) {
    return handleRouteError(res, error, 'Notifications fetch');
  }
};

export const markRead = async (req, res) => {
  try {
    const updated = await notificationsService.markAsRead(req.params.id, req.user.userId);
    res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Notification read update');
  }
};

export const markAllRead = async (req, res) => {
  try {
    await notificationsService.markAllAsRead(req.user.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return handleRouteError(res, error, 'Notifications mark all read');
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await notificationsService.deleteNotification(req.params.id, req.user.userId);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Notification delete');
  }
};

export const clearAll = async (req, res) => {
  try {
    await notificationsService.clearAllNotifications(req.user.userId);
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Notifications clear');
  }
};
