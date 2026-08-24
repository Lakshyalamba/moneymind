import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { chatWithAI } from './aiController.js';

const router = express.Router();

const ipRequests = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

export const aiRateLimiter = (req, res, next) => {
    const ip = req.ip || 
               req.headers['x-forwarded-for'] || 
               req.socket.remoteAddress || 
               'unknown-ip';
               
    const now = Date.now();
    
    if (!ipRequests.has(ip)) {
        ipRequests.set(ip, []);
    }

    const timestamps = ipRequests.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
    timestamps.push(now);
    ipRequests.set(ip, timestamps);

    if (timestamps.length > MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Please try again after a minute.' });
    }

    next();
};

router.post('/ai/chat', authenticateToken, aiRateLimiter, chatWithAI);

export default router;
