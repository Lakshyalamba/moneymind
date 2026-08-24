import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { chatWithAI } from '../controllers/aiController.js';

const router = express.Router();

// Memory-based rate limiter mapping IP address to timestamps
const ipRequests = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per window

export const aiRateLimiter = (req, res, next) => {
    // Determine client IP address
    const ip = req.ip || 
               req.headers['x-forwarded-for'] || 
               req.socket.remoteAddress || 
               'unknown-ip';
               
    const now = Date.now();
    
    if (!ipRequests.has(ip)) {
        ipRequests.set(ip, []);
    }

    // Filter out timestamps older than the window
    const timestamps = ipRequests.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
    timestamps.push(now);
    ipRequests.set(ip, timestamps);

    if (timestamps.length > MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Please try again after a minute.' });
    }

    next();
};

/**
 * AI Chat Routes
 * All routes are protected and require authentication
 */

// POST /api/ai/chat - Send message to AI financial advisor with rate limiting
router.post('/api/ai/chat', authenticateToken, aiRateLimiter, chatWithAI);

export default router;
