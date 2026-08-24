import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import * as notificationsController from './notificationsController.js';

const router = express.Router();

router.get('/notifications', authenticateToken, notificationsController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, notificationsController.markRead);
router.put('/notifications/read-all', authenticateToken, notificationsController.markAllRead);
router.delete('/notifications/:id', authenticateToken, notificationsController.deleteNotification);
router.delete('/notifications', authenticateToken, notificationsController.clearAll);

export default router;
