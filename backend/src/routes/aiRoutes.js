import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { chatWithAI } from '../controllers/aiController.js';

const router = express.Router();

/**
 * AI Chat Routes
 * All routes are protected and require authentication
 */

// POST /api/ai/chat - Send message to AI financial advisor
router.post('/ai/chat', authenticateToken, chatWithAI);

export default router;
