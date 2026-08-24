import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import * as subscriptionsController from './subscriptionsController.js';

const router = express.Router();

router.get('/recurring', authenticateToken, subscriptionsController.listRecurring);
router.post('/recurring', authenticateToken, subscriptionsController.createRecurring);
router.put('/recurring/:id', authenticateToken, subscriptionsController.updateRecurring);
router.delete('/recurring/:id', authenticateToken, subscriptionsController.deleteRecurring);
router.post('/recurring/process', authenticateToken, subscriptionsController.processRecurring);

export default router;
