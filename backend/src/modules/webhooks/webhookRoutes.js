import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import * as webhookController from './webhookController.js';

const router = express.Router();

router.get('/webhooks', authenticateToken, webhookController.listWebhooks);
router.post('/webhooks', authenticateToken, webhookController.createWebhook);
router.put('/webhooks/:id', authenticateToken, webhookController.updateWebhook);
router.delete('/webhooks/:id', authenticateToken, webhookController.deleteWebhook);

export default router;
