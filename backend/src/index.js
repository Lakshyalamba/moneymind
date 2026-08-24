import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import './config/passport.js';

const app = express();
const PORT = process.env.PORT || 3333;

// Structured CORS whitelist
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

// 1. Secure HTTP Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; connect-src 'self' http://localhost:3333; font-src 'self' https://cdn.jsdelivr.net;");
  next();
});

// 2. Global IP-based Memory Rate Limiter
const globalIpRequests = new Map();
const GLOBAL_WINDOW = 60 * 1000;
const GLOBAL_LIMIT = 200;

const globalRateLimiter = (req, res, next) => {
  // Avoid rate-limiting health checks
  if (req.path === '/api/health') return next();
  
  const ip = req.ip || 
             req.headers['x-forwarded-for'] || 
             req.socket.remoteAddress || 
             'unknown-ip';
             
  const now = Date.now();
  
  if (!globalIpRequests.has(ip)) {
    globalIpRequests.set(ip, []);
  }
  
  const timestamps = globalIpRequests.get(ip).filter(t => now - t < GLOBAL_WINDOW);
  timestamps.push(now);
  globalIpRequests.set(ip, timestamps);
  
  if (timestamps.length > GLOBAL_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
};

app.use(globalRateLimiter);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api', authRoutes);
app.use('/api', aiRoutes);

// 3. Centralized Production Error Handler (Hides DB details, stack traces)
app.use((err, req, res, next) => {
  console.error('[moneymind-server-error]:', err);
  res.status(500).json({
    error: 'An unexpected internal server error occurred. Please try again later.'
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
