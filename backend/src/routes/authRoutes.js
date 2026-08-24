import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { Prisma, PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

const isDatabaseUnavailableError = (error) => (
  error instanceof Prisma.PrismaClientInitializationError ||
  error?.name === 'PrismaClientInitializationError' ||
  error?.message?.includes("Can't reach database server")
);

const handleRouteError = (res, error, context = 'Request') => {
  console.error(`${context} error:`, error);

  if (isDatabaseUnavailableError(error)) {
    return res.status(503).json({
      error: 'Database unavailable. Start PostgreSQL and try again.'
    });
  }

  return res.status(500).json({ error: 'Internal server error' });
};


// Google OAuth routes
router.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: 'Google authentication is not configured on the server.' });
  }
  const authOptions = {
    scope: ['profile', 'email']
  };
  
  // Force re-authentication if prompt is select_account
  if (req.query.prompt === 'select_account') {
    authOptions.prompt = 'select_account';
  }
  
  passport.authenticate('google', authOptions)(req, res, next);
});

router.get('/auth/google/callback', (req, res, next) => {
  const firstFrontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)[0] || 'http://localhost:5173';

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${firstFrontendUrl}/login?error=oauth_not_configured`);
  }
  
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      console.error('Google OAuth authentication failed:', err);
      return res.redirect(`${firstFrontendUrl}/login?error=oauth_failed`);
    }
    
    try {
      const { accessToken, refreshToken } = generateTokens(user);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      setTokenCookies(res, accessToken, refreshToken);
      res.redirect(`${firstFrontendUrl}/dashboard`);
    } catch (dbError) {
      console.error('Google OAuth callback database error:', dbError);
      res.redirect(`${firstFrontendUrl}/login?error=oauth_failed`);
    }
  })(req, res, next);
});


router.post('/auth/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, refreshToken }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    setTokenCookies(res, accessToken, newRefreshToken);
    res.json({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { refreshToken: null }
      });
    }
  } catch (error) {
    // Ignore errors, just clear cookies
  }

  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// Request Body Validation Middleware
// ==========================================
const validateBody = (rules) => {
  return (req, res, next) => {
    for (const [field, validators] of Object.entries(rules)) {
      const val = req.body[field];
      if (validators.required && (val === undefined || val === null || val === '')) {
        return res.status(400).json({ error: `Field '${field}' is required.` });
      }
      if (val !== undefined && val !== null && val !== '') {
        if (validators.type === 'number' && isNaN(Number(val))) {
          return res.status(400).json({ error: `Field '${field}' must be a number.` });
        }
        if (validators.positive && Number(val) <= 0) {
          return res.status(400).json({ error: `Field '${field}' must be positive.` });
        }
        if (validators.enum && !validators.enum.includes(val)) {
          return res.status(400).json({ error: `Field '${field}' must be one of: ${validators.enum.join(', ')}.` });
        }
        if (validators.regex && !validators.regex.test(val)) {
          return res.status(400).json({ error: `Field '${field}' format is invalid.` });
        }
      }
    }
    next();
  };
};

const signupSchema = {
  name: { required: true },
  email: { required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true }
};

const loginSchema = {
  email: { required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true }
};

const transactionSchema = {
  amount: { required: true, type: 'number', positive: true },
  type: { required: true, enum: ['income', 'expense'] },
  date: { required: true, regex: /^\d{4}-\d{2}-\d{2}$/ }
};

const transactionUpdateSchema = {
  amount: { type: 'number', positive: true },
  type: { enum: ['income', 'expense'] },
  date: { regex: /^\d{4}-\d{2}-\d{2}$/ }
};

const budgetSchema = {
  category: { required: true },
  limit: { required: true, type: 'number', positive: true }
};

const goalSchema = {
  title: { required: true },
  targetAmount: { required: true, type: 'number', positive: true },
  deadline: { required: true, regex: /^\d{4}-\d{2}-\d{2}$/ }
};

router.post('/signup', validateBody(signupSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });
    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    setTokenCookies(res, accessToken, refreshToken);
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    return handleRouteError(res, error, 'Signup');
  }
});
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    setTokenCookies(res, accessToken, refreshToken);
    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    return handleRouteError(res, error, 'Login');
  }
});
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, phone: true, bio: true, profilePhoto: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    return handleRouteError(res, error, 'Profile fetch');
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, bio, profilePhoto } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(profilePhoto !== undefined && { profilePhoto })
      },
      select: { id: true, name: true, email: true, phone: true, bio: true, profilePhoto: true, createdAt: true }
    });

    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Profile update');
  }
});

// Transaction routes
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { search = '', filter = 'all', sortBy = 'date', sortOrder = 'desc', page = 1, limit = 7 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      userId: req.user.userId,
      ...(search && {
        OR: [
          { category: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(filter !== 'all' && { type: filter })
    };

    // Build orderBy clause
    const orderBy = {};
    if (sortBy === 'date') {
      orderBy.date = sortOrder;
    } else if (sortBy === 'amount') {
      orderBy.amount = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const totalCount = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
      skip,
      take: parseInt(limit)
    });

    const formattedTransactions = transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount)
    }));

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      transactions: formattedTransactions,
      totalPages,
      currentPage: parseInt(page),
      totalCount
    });
  } catch (error) {
    return handleRouteError(res, error, 'Transactions fetch');
  }
});

// ==========================================
// Categorization & Anomaly Detection Helpers
// ==========================================

const GLOBAL_CATEGORIES = [
  'Food & Dining', 'Salary', 'Housing', 'Utilities', 
  'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Freelance', 'Other'
];

const GLOBAL_MERCHANT_MAP = [
  { pattern: 'swiggy', category: 'Food & Dining' },
  { pattern: 'zomato', category: 'Food & Dining' },
  { pattern: 'starbucks', category: 'Food & Dining' },
  { pattern: 'mcdonald', category: 'Food & Dining' },
  { pattern: 'uber', category: 'Transportation' },
  { pattern: 'ola', category: 'Transportation' },
  { pattern: 'rapido', category: 'Transportation' },
  { pattern: 'netflix', category: 'Entertainment' },
  { pattern: 'spotify', category: 'Entertainment' },
  { pattern: 'prime video', category: 'Entertainment' },
  { pattern: 'amazon', category: 'Shopping' },
  { pattern: 'flipkart', category: 'Shopping' },
  { pattern: 'myntra', category: 'Shopping' },
  { pattern: 'rent', category: 'Housing' },
  { pattern: 'salary', category: 'Salary' },
  { pattern: 'electricity', category: 'Utilities' },
  { pattern: 'water bill', category: 'Utilities' },
  { pattern: 'wifi', category: 'Utilities' },
  { pattern: 'internet', category: 'Utilities' }
];

// Helper to extract clean merchant keyword from note
const getMerchantKeyword = (note) => {
  if (!note) return null;
  const clean = note.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.length > 2 ? clean : null;
};

// Layered Automatic Categorization
const runLayeredCategorization = async (userId, note) => {
  if (!note || note.trim().length === 0) return 'Other';
  
  const keyword = getMerchantKeyword(note);
  
  // Layer 1: Learned Custom User Rules
  if (keyword) {
    const userRule = await prisma.categoryRule.findUnique({
      where: {
        userId_pattern: {
          userId,
          pattern: keyword
        }
      }
    });
    if (userRule) return userRule.category;
  }
  
  // Layer 2: Global Merchant Keyword Map
  const cleanNote = note.toLowerCase();
  for (const item of GLOBAL_MERCHANT_MAP) {
    if (cleanNote.includes(item.pattern)) {
      return item.category;
    }
  }

  // Layer 3: ML/AI Classifier (Gemini)
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const prompt = `Classify this transaction description: "${note}" into exactly one of these categories:
${GLOBAL_CATEGORIES.map(c => `- ${c}`).join('\n')}

Return ONLY the category name as plain text. Do not include quotes, markdown bolding, periods, or other explanation.`;
      
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI Classification Timeout')), 3000))
      ]);
      const text = result.response.text().trim();
      if (GLOBAL_CATEGORIES.includes(text)) {
        return text;
      }
    } catch (err) {
      console.error('AI categorization error fallback:', err.message);
    }
  }

  // Layer 4: Fallback
  return 'Other';
};

// Dynamic rule learner
const learnPersonalizedRule = async (userId, note, category) => {
  const keyword = getMerchantKeyword(note);
  if (!keyword || !GLOBAL_CATEGORIES.includes(category)) return;

  try {
    await prisma.categoryRule.upsert({
      where: {
        userId_pattern: {
          userId,
          pattern: keyword
        }
      },
      update: { category },
      create: { userId, pattern: keyword, category }
    });
  } catch (err) {
    console.error('Error learning user rule:', err.message);
  }
};

// Z-Score Anomaly Detector
const detectSpendingAnomaly = async (userId, category, amount) => {
  try {
    const history = await prisma.transaction.findMany({
      where: { userId, category },
      take: 30,
      orderBy: { date: 'desc' }
    });

    if (history.length < 3) {
      return { isAnomaly: false, anomalyReason: null };
    }

    const amounts = history.map(t => parseFloat(t.amount));
    const count = amounts.length;
    const mean = amounts.reduce((sum, val) => sum + val, 0) / count;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // If stdDev is 0, we avoid division by zero
    const z = stdDev > 0 ? (amount - mean) / stdDev : 0;
    const threshold = 2.5;

    if (z >= threshold) {
      const multiplier = (amount / mean).toFixed(1);
      return {
        isAnomaly: true,
        anomalyReason: `Unusual spending compared with your historical spending. This transaction is approximately ${multiplier}x your usual spending for this category.`
      };
    }
  } catch (err) {
    console.error('Error calculating anomaly:', err.message);
  }

  return { isAnomaly: false, anomalyReason: null };
};

router.post('/transactions', authenticateToken, validateBody(transactionSchema), async (req, res) => {
  try {
    const { amount, type, category: reqCategory, note, date } = req.body;
    const userId = req.user.userId;

    // Run Layered Categorization if category is empty/Other
    let category = reqCategory;
    if (!category || category === 'Other' || category === '') {
      category = await runLayeredCategorization(userId, note || '');
    }

    // Run Anomaly Detection (expenses only)
    let isAnomaly = false;
    let anomalyReason = null;
    if (type === 'expense') {
      const anomalyResult = await detectSpendingAnomaly(userId, category, parseFloat(amount));
      isAnomaly = anomalyResult.isAnomaly;
      anomalyReason = anomalyResult.anomalyReason;
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: amount.toString(),
        type,
        category,
        note: note || '',
        date,
        isAnomaly,
        anomalyReason,
        userId
      }
    });

    // Learn rule if manual category was provided
    if (reqCategory && reqCategory !== 'Other' && reqCategory !== '' && note) {
      await learnPersonalizedRule(userId, note, reqCategory);
    }

    res.status(201).json({
      ...transaction,
      amount: parseFloat(transaction.amount)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Transaction creation');
  }
});

router.put('/transactions/:id', authenticateToken, validateBody(transactionUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category: reqCategory, note, date } = req.body;
    const userId = req.user.userId;

    const existing = await prisma.transaction.findUnique({
      where: { id: parseInt(id), userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Run Layered Categorization if category is empty/Other
    let category = reqCategory || existing.category;
    if (!reqCategory || reqCategory === 'Other' || reqCategory === '') {
      category = await runLayeredCategorization(userId, note || existing.note || '');
    }

    // Learn rule if manual category correction happened
    if (reqCategory && reqCategory !== existing.category && (note || existing.note)) {
      await learnPersonalizedRule(userId, note || existing.note, reqCategory);
    }

    // Run Anomaly Detection (expenses only)
    let isAnomaly = false;
    let anomalyReason = null;
    const targetType = type || existing.type;
    if (targetType === 'expense') {
      const targetAmount = amount ? parseFloat(amount) : parseFloat(existing.amount);
      const anomalyResult = await detectSpendingAnomaly(userId, category, targetAmount);
      isAnomaly = anomalyResult.isAnomaly;
      anomalyReason = anomalyResult.anomalyReason;
    }

    const transaction = await prisma.transaction.update({
      where: {
        id: parseInt(id),
        userId
      },
      data: {
        amount: amount ? amount.toString() : existing.amount,
        type: type || existing.type,
        category,
        note: note !== undefined ? note : existing.note,
        date: date || existing.date,
        isAnomaly,
        anomalyReason
      }
    });

    res.json({
      ...transaction,
      amount: parseFloat(transaction.amount)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Transaction update');
  }
});

router.delete('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({
      where: { id: parseInt(id), userId: req.user.userId }
    });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Transaction delete');
  }
});

// Goal routes
router.get('/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    const formattedGoals = goals.map(g => ({
      ...g,
      targetAmount: parseFloat(g.targetAmount),
      currentAmount: parseFloat(g.currentAmount)
    }));
    res.json(formattedGoals);
  } catch (error) {
    return handleRouteError(res, error, 'Goals fetch');
  }
});

router.post('/goals', authenticateToken, validateBody(goalSchema), async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline } = req.body;
    const goal = await prisma.goal.create({
      data: {
        title,
        targetAmount: targetAmount.toString(),
        currentAmount: (currentAmount || 0).toString(),
        deadline,
        userId: req.user.userId
      }
    });
    res.status(201).json({
      ...goal,
      targetAmount: parseFloat(goal.targetAmount),
      currentAmount: parseFloat(goal.currentAmount)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Goal creation');
  }
});

router.put('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, targetAmount, currentAmount, deadline } = req.body;
    const goal = await prisma.goal.update({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      },
      data: {
        title,
        targetAmount: targetAmount.toString(),
        currentAmount: (currentAmount || 0).toString(),
        deadline
      }
    });
    res.json({
      ...goal,
      targetAmount: parseFloat(goal.targetAmount),
      currentAmount: parseFloat(goal.currentAmount)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Goal update');
  }
});

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to calculate start and end dates of current and previous periods
const getPeriods = (period, customStart, customEnd) => {
  const today = new Date();
  let start, end, prevStart, prevEnd;

  if (period === 'custom') {
    if (!customStart || !customEnd) {
      throw new Error('Custom period requires startDate and endDate');
    }
    start = customStart;
    end = customEnd;
    
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error('Invalid dates provided');
    }
    if (sDate > eDate) {
      throw new Error('Start date cannot be after end date');
    }

    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const pStart = new Date(sDate);
    pStart.setDate(pStart.getDate() - diffDays);
    const pEnd = new Date(sDate);
    pEnd.setDate(pEnd.getDate() - 1);
    
    prevStart = formatDate(pStart);
    prevEnd = formatDate(pEnd);
  } else if (period === 'previous-month') {
    const currentMonthFirst = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const pStart = new Date(currentMonthFirst);
    pStart.setMonth(pStart.getMonth() - 1);
    const pEnd = new Date(currentMonthFirst);
    pEnd.setDate(pEnd.getDate() - 1);
    
    start = formatDate(pStart);
    end = formatDate(pEnd);
    
    const ppStart = new Date(pStart);
    ppStart.setMonth(ppStart.getMonth() - 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else if (period === 'last-3-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else if (period === 'last-6-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else if (period === 'last-12-months') {
    const pStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear() - 2, today.getMonth(), 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  } else {
    // Default to 'current-month'
    const pStart = new Date(today.getFullYear(), today.getMonth(), 1);
    start = formatDate(pStart);
    end = formatDate(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDate(ppStart);
    prevEnd = formatDate(ppEnd);
  }

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd }
  };
};

// GET /api/analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = 'current-month', startDate, endDate } = req.query;
    const userId = req.user.userId;

    let periods;
    try {
      periods = getPeriods(period, startDate, endDate);
    } catch (dateError) {
      return res.status(400).json({ error: dateError.message });
    }

    const curStart = periods.current.start;
    const curEnd = periods.current.end;
    const prevStart = periods.previous.start;
    const prevEnd = periods.previous.end;

    // Fetch current, previous, and all-time transactions
    const [currentTransactions, previousTransactions, allTransactions, goals, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: curStart, lte: curEnd } }
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: prevStart, lte: prevEnd } }
      }),
      prisma.transaction.findMany({
        where: { userId }
      }),
      prisma.goal.findMany({
        where: { userId }
      }),
      prisma.budget.findMany({
        where: { userId }
      })
    ]);

    // Format all transaction amounts to Float for consistency
    const formatTx = (txList) => txList.map(t => ({
      ...t,
      amount: parseFloat(t.amount)
    }));

    const curTx = formatTx(currentTransactions);
    const prevTx = formatTx(previousTransactions);
    const allTx = formatTx(allTransactions);

    // Calculate current totals
    const totalIncome = curTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = curTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Calculate previous totals
    const prevIncome = prevTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const prevSavings = prevIncome - prevExpense;

    // Calculate MoM changes
    const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null;
    const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null;
    const savingsChange = prevSavings !== 0 ? ((netSavings - prevSavings) / Math.abs(prevSavings)) * 100 : null;

    // Net Worth (Total Income - Total Expenses all time)
    const allTimeIncome = allTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const allTimeExpense = allTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netWorth = allTimeIncome - allTimeExpense;

    // Category spending breakdown
    const categorySpending = {};
    curTx.filter(t => t.type === 'expense').forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const categoryBreakdown = Object.entries(categorySpending).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    // Top spending categories
    const topCategories = categoryBreakdown.slice(0, 5);

    // Daily spending trends (continuous dates)
    const dailyTrend = [];
    const tempDate = new Date(curStart);
    const endDateObj = new Date(curEnd);
    while (tempDate <= endDateObj) {
      dailyTrend.push({ date: formatDate(tempDate), amount: 0 });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    curTx.filter(t => t.type === 'expense').forEach(t => {
      const match = dailyTrend.find(d => d.date === t.date);
      if (match) match.amount += t.amount;
    });

    // Rolling 6-month monthly cash flow
    const monthlyTrend = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      monthlyTrend.push({ yearMonth, month: name, income: 0, expense: 0, savings: 0 });
    }
    const startOf6Months = monthlyTrend[0].yearMonth + '-01';
    const rolling6MonthsTx = allTx.filter(t => t.date >= startOf6Months);
    rolling6MonthsTx.forEach(t => {
      const tMonth = t.date.slice(0, 7);
      const match = monthlyTrend.find(m => m.yearMonth === tMonth);
      if (match) {
        if (t.type === 'income') match.income += t.amount;
        else match.expense += t.amount;
      }
    });
    monthlyTrend.forEach(m => {
      m.savings = m.income - m.expense;
    });

    // Fixed vs Variable & Recurring vs One-time
    let fixedExpenses = 0;
    let variableExpenses = 0;
    let recurringExpenses = 0;
    let oneTimeExpenses = 0;

    curTx.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category.toLowerCase();
      const note = (t.note || '').toLowerCase();
      
      const isFixed = ['housing', 'utilities'].includes(cat);
      if (isFixed) fixedExpenses += t.amount;
      else variableExpenses += t.amount;

      const isRecurring = isFixed || 
                          note.includes('subscription') || 
                          note.includes('monthly') || 
                          note.includes('recurring');
      if (isRecurring) recurringExpenses += t.amount;
      else oneTimeExpenses += t.amount;
    });

    // Averages
    const numDays = dailyTrend.length;
    const averageDailySpending = numDays > 0 ? totalExpense / numDays : 0;

    const sDate = new Date(curStart);
    const eDate = new Date(curEnd);
    const numMonths = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth()) + 1;
    const averageMonthlySpending = numMonths > 0 ? totalExpense / numMonths : 0;

    // Budget utilization mapping
    const budgetUtilization = budgets.map(b => {
      const spent = curTx
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      const limit = parseFloat(b.limit);
      return {
        id: b.id,
        category: b.category,
        limit,
        spent,
        percentage: limit > 0 ? (spent / limit) * 100 : 0
      };
    });

    // Goal progress mapping
    const goalProgress = goals.map(g => {
      const target = parseFloat(g.targetAmount);
      const current = parseFloat(g.currentAmount);
      return {
        id: g.id,
        title: g.title,
        targetAmount: target,
        currentAmount: current,
        percentage: target > 0 ? (current / target) * 100 : 0,
        deadline: g.deadline
      };
    });

    // Generate insights
    const insights = [];
    if (savingsRate > 20) {
      insights.push(`Your savings rate is ${savingsRate.toFixed(1)}% this period, which is higher than the recommended 20% budget benchmark.`);
    } else if (savingsRate > 0) {
      insights.push(`Your savings rate is ${savingsRate.toFixed(1)}% this period. Consider reducing variable expenses to reach the recommended 20% benchmark.`);
    } else {
      insights.push(`You spent more than you earned this period. Review your top spending categories to identify areas to cut back.`);
    }

    if (topCategories.length > 0) {
      insights.push(`Your highest expense category is ${topCategories[0].category}, accounting for ${topCategories[0].percentage.toFixed(1)}% of your total spending.`);
    }

    const highUtilizedBudgets = budgetUtilization.filter(b => b.percentage > 90);
    if (highUtilizedBudgets.length > 0) {
      insights.push(`Warning: You have utilized ${highUtilizedBudgets[0].percentage.toFixed(0)}% of your budget for ${highUtilizedBudgets[0].category}.`);
    }

    if (expenseChange !== null) {
      if (expenseChange > 10) {
        insights.push(`Your expenses increased by ${expenseChange.toFixed(1)}% compared to the previous period.`);
      } else if (expenseChange < -10) {
        insights.push(`Great job! Your spending decreased by ${Math.abs(expenseChange).toFixed(1)}% compared to the previous period.`);
      }
    }

    res.json({
      period: { start: curStart, end: curEnd },
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        netWorth
      },
      comparison: {
        incomeChange,
        expenseChange,
        savingsChange
      },
      categoryBreakdown,
      topCategories,
      dailyTrend,
      monthlyTrend,
      averages: {
        averageDailySpending,
        averageMonthlySpending
      },
      breakdowns: {
        fixedExpenses,
        variableExpenses,
        recurringExpenses,
        oneTimeExpenses
      },
      budgetUtilization,
      goalProgress,
      insights
    });

  } catch (error) {
    return handleRouteError(res, error, 'Analytics calculation');
  }
});

// GET /api/budgets
router.get('/budgets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { category: 'asc' }
    });

    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth(); // 0-indexed
    const curMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
    
    // Total days in current month
    const totalDaysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysElapsed = today.getDate();
    const daysRemaining = totalDaysInMonth - daysElapsed;

    // Fetch transactions in parallel for current month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { startsWith: curMonthStr },
        type: 'expense'
      }
    });

    const formatted = budgets.map(b => {
      const categoryTx = transactions.filter(t => t.category.toLowerCase() === b.category.toLowerCase());
      const spent = categoryTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const limit = parseFloat(b.limit);
      const remaining = limit - spent;
      const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;

      // Forecasting calculations
      let averageDailySpending = 0;
      let projectedSpending = 0;
      let expectedDeficit = 0;
      let forecastConfidence = 'Low';
      let hasData = false;

      // We need at least 3 days elapsed and 1 transaction to build baseline
      if (daysElapsed >= 3 && categoryTx.length > 0) {
        averageDailySpending = spent / daysElapsed;
        projectedSpending = averageDailySpending * totalDaysInMonth;
        expectedDeficit = projectedSpending - limit;
        hasData = true;

        if (daysElapsed >= 15) {
          forecastConfidence = 'High';
        } else if (daysElapsed >= 5) {
          forecastConfidence = 'Medium';
        }
      }

      return {
        ...b,
        limit,
        spent,
        remaining,
        percentageUsed: parseFloat(percentageUsed.toFixed(1)),
        daysElapsed,
        daysRemaining,
        averageDailySpending: parseFloat(averageDailySpending.toFixed(2)),
        projectedSpending: parseFloat(projectedSpending.toFixed(2)),
        expectedDeficit: parseFloat(expectedDeficit.toFixed(2)),
        forecastConfidence,
        hasData
      };
    });

    // Fire alert checks in background
    checkAndGenerateAlerts(userId).catch(e => console.error('Alert engine failed:', e.message));

    res.json(formatted);
  } catch (error) {
    return handleRouteError(res, error, 'Budgets fetch');
  }
});

// POST /api/budgets
router.post('/budgets', authenticateToken, validateBody(budgetSchema), async (req, res) => {
  try {
    const { category, limit } = req.body;
    if (!category || limit === undefined || parseFloat(limit) < 0) {
      return res.status(400).json({ error: 'Invalid budget parameters' });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_category: {
          userId: req.user.userId,
          category
        }
      },
      update: {
        limit: limit.toString()
      },
      create: {
        userId: req.user.userId,
        category,
        limit: limit.toString()
      }
    });

    res.json({
      ...budget,
      limit: parseFloat(budget.limit)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Budget creation');
  }
});

// DELETE /api/budgets/:id
router.delete('/budgets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.budget.delete({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      }
    });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Budget delete');
  }
});

// Helper to calculate three continuous periods
const getThreePeriods = (period, customStart, customEnd) => {
  const today = new Date();
  
  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  let start, end, prevStart, prevEnd, prePrevStart, prePrevEnd;

  if (period === 'custom') {
    if (!customStart || !customEnd) {
      throw new Error('Custom period requires startDate and endDate');
    }
    start = customStart;
    end = customEnd;
    
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error('Invalid dates provided');
    }
    if (sDate > eDate) {
      throw new Error('Start date cannot be after end date');
    }

    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const pStart = new Date(sDate);
    pStart.setDate(pStart.getDate() - diffDays);
    const pEnd = new Date(sDate);
    pEnd.setDate(pEnd.getDate() - 1);
    
    prevStart = formatDateStr(pStart);
    prevEnd = formatDateStr(pEnd);

    const ppStart = new Date(pStart);
    ppStart.setDate(ppStart.getDate() - diffDays);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);

    prePrevStart = formatDateStr(ppStart);
    prePrevEnd = formatDateStr(ppEnd);
  } else if (period === 'previous-month') {
    const currentMonthFirst = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const pStart = new Date(currentMonthFirst);
    pStart.setMonth(pStart.getMonth() - 1);
    const pEnd = new Date(currentMonthFirst);
    pEnd.setDate(pEnd.getDate() - 1);
    
    start = formatDateStr(pStart);
    end = formatDateStr(pEnd);
    
    const ppStart = new Date(pStart);
    ppStart.setMonth(ppStart.getMonth() - 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDateStr(ppStart);
    prevEnd = formatDateStr(ppEnd);

    const pppStart = new Date(ppStart);
    pppStart.setMonth(pppStart.getMonth() - 1);
    const pppEnd = new Date(ppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDateStr(pppStart);
    prePrevEnd = formatDateStr(pppEnd);
  } else if (period === 'last-3-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    start = formatDateStr(pStart);
    end = formatDateStr(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDateStr(ppStart);
    prevEnd = formatDateStr(ppEnd);

    const pppStart = new Date(today.getFullYear(), today.getMonth() - 9, 1);
    const pppEnd = new Date(ppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDateStr(pppStart);
    prePrevEnd = formatDateStr(pppEnd);
  } else if (period === 'last-6-months') {
    const pStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    start = formatDateStr(pStart);
    end = formatDateStr(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDateStr(ppStart);
    prevEnd = formatDateStr(ppEnd);

    const pppStart = new Date(today.getFullYear(), today.getMonth() - 18, 1);
    const pppEnd = new Date(pppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDateStr(pppStart);
    prePrevEnd = formatDateStr(pppEnd);
  } else if (period === 'last-12-months') {
    const pStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    start = formatDateStr(pStart);
    end = formatDateStr(today);
    
    const ppStart = new Date(today.getFullYear() - 2, today.getMonth(), 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDateStr(ppStart);
    prevEnd = formatDateStr(ppEnd);

    const pppStart = new Date(today.getFullYear() - 3, today.getMonth(), 1);
    const pppEnd = new Date(pppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDateStr(pppStart);
    prePrevEnd = formatDateStr(pppEnd);
  } else {
    // Default to 'current-month'
    const pStart = new Date(today.getFullYear(), today.getMonth(), 1);
    start = formatDateStr(pStart);
    end = formatDateStr(today);
    
    const ppStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const ppEnd = new Date(pStart);
    ppEnd.setDate(ppEnd.getDate() - 1);
    
    prevStart = formatDateStr(ppStart);
    prevEnd = formatDateStr(ppEnd);

    const pppStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const pppEnd = new Date(pppStart);
    pppEnd.setDate(pppEnd.getDate() - 1);

    prePrevStart = formatDateStr(pppStart);
    prePrevEnd = formatDateStr(pppEnd);
  }

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd },
    prePrevious: { start: prePrevStart, end: prePrevEnd }
  };
};

// Helper scoring algorithm
const calculateFinancialHealth = (current, previous, allTime, budgets, goals) => {
  const curIncome = current.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const curExpense = current.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const prevExpense = previous.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const components = [];

  // 1. Savings Rate (25 pts)
  const savingsRate = curIncome > 0 ? ((curIncome - curExpense) / curIncome) * 100 : 0;
  let savingsRateScore = 0;
  let savingsRateExplanation = '';
  if (curIncome === 0) {
    savingsRateExplanation = 'No income recorded in this period.';
  } else if (savingsRate >= 20) {
    savingsRateScore = 25;
    savingsRateExplanation = `Excellent savings rate of ${savingsRate.toFixed(0)}% (target is 20%+).`;
  } else if (savingsRate > 0) {
    savingsRateScore = parseFloat(((savingsRate / 20) * 25).toFixed(1));
    savingsRateExplanation = `Savings rate of ${savingsRate.toFixed(0)}% is positive. Try to reach 20%.`;
  } else {
    savingsRateScore = 0;
    savingsRateExplanation = `Negative savings rate. Spending exceeded earnings by ₹${Math.abs(curIncome - curExpense).toLocaleString('en-IN')}.`;
  }

  components.push({
    name: 'Savings Rate',
    score: savingsRateScore,
    maxScore: 25,
    explanation: savingsRateExplanation,
    status: 'active'
  });

  // 2. Budget Discipline (25 pts)
  let budgetScore = 0;
  let budgetExplanation = '';
  let budgetStatus = 'active';

  if (budgets.length === 0) {
    budgetStatus = 'unavailable';
    budgetExplanation = 'Configure category budgets to track discipline scoring.';
  } else {
    let totalBudgetScore = 0;
    budgets.forEach(b => {
      const spent = current
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      const limit = parseFloat(b.limit);
      
      let catScore = 1;
      if (limit > 0 && spent > limit) {
        catScore = Math.max(0, 1 - (spent - limit) / limit);
      }
      totalBudgetScore += catScore;
    });

    const avgScore = totalBudgetScore / budgets.length;
    budgetScore = parseFloat((avgScore * 25).toFixed(1));
    budgetExplanation = `Tracking ${budgets.length} category budgets. Average limit adherence is ${(avgScore * 100).toFixed(0)}%.`;
  }

  components.push({
    name: 'Budget Discipline',
    score: budgetScore,
    maxScore: 25,
    explanation: budgetExplanation,
    status: budgetStatus
  });

  // 3. Expense Stability (20 pts)
  let stabilityScore = 0;
  let stabilityExplanation = '';
  let stabilityStatus = 'active';

  if (previous.length === 0) {
    stabilityStatus = 'unavailable';
    stabilityExplanation = 'Stability score requires transaction history from the previous period.';
  } else {
    const expenseIncrease = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : 0;
    
    if (curExpense <= prevExpense) {
      stabilityScore = 20;
      stabilityExplanation = `Expenses remained stable or decreased MoM (reduced by ${Math.abs(expenseIncrease).toFixed(0)}%).`;
    } else if (expenseIncrease <= 10) {
      stabilityScore = 15;
      stabilityExplanation = `Minor expense increase of ${expenseIncrease.toFixed(0)}% compared to last period.`;
    } else if (expenseIncrease <= 30) {
      stabilityScore = 10;
      stabilityExplanation = `Moderate expense increase of ${expenseIncrease.toFixed(0)}% MoM. Control discretionary spending.`;
    } else if (expenseIncrease <= 50) {
      stabilityScore = 5;
      stabilityExplanation = `High expense spike of ${expenseIncrease.toFixed(0)}% MoM. Review recent purchases.`;
    } else {
      stabilityScore = 0;
      stabilityExplanation = `Expenses increased by over 50% (${expenseIncrease.toFixed(0)}%) MoM. Immediate review recommended.`;
    }
  }

  components.push({
    name: 'Expense Stability',
    score: stabilityScore,
    maxScore: 20,
    explanation: stabilityExplanation,
    status: stabilityStatus
  });

  // 4. Goal Progress (15 pts)
  let goalScore = 0;
  let goalExplanation = '';
  let goalStatus = 'active';

  if (goals.length === 0) {
    goalStatus = 'unavailable';
    goalExplanation = 'Configure active savings goals to evaluate goal progress score.';
  } else {
    let totalGoalProgress = 0;
    goals.forEach(g => {
      const target = parseFloat(g.targetAmount);
      const currentVal = parseFloat(g.currentAmount);
      const progress = target > 0 ? Math.min(1, currentVal / target) : 0;
      totalGoalProgress += progress;
    });

    const avgGoalProgress = totalGoalProgress / goals.length;
    goalScore = parseFloat((avgGoalProgress * 15).toFixed(1));
    goalExplanation = `Monitoring ${goals.length} active savings goals. Average progress is ${(avgGoalProgress * 100).toFixed(0)}%.`;
  }

  components.push({
    name: 'Goal Progress',
    score: goalScore,
    maxScore: 15,
    explanation: goalExplanation,
    status: goalStatus
  });

  // 5. Emergency Buffer (15 pts)
  const allTimeIncome = allTime.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const allTimeExpense = allTime.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netWorth = allTimeIncome - allTimeExpense;

  const expenseTransactions = allTime.filter(t => t.type === 'expense');
  if (expenseTransactions.length > 0) {
    const expenseMonths = {};
    expenseTransactions.forEach(t => {
      const month = t.date.slice(0, 7);
      expenseMonths[month] = (expenseMonths[month] || 0) + t.amount;
    });
    const monthsList = Object.values(expenseMonths);
    const avgMonthlyExpense = monthsList.reduce((sum, m) => sum + m, 0) / monthsList.length;

    const bufferMonths = avgMonthlyExpense > 0 ? netWorth / avgMonthlyExpense : 0;

    let bufferScore = 0;
    let bufferExplanation = '';
    if (bufferMonths >= 3) {
      bufferScore = 15;
      bufferExplanation = `Net savings cover ${bufferMonths.toFixed(1)} months of average expenses (Target is 3+ months).`;
    } else if (bufferMonths > 0) {
      bufferScore = parseFloat(((bufferMonths / 3) * 15).toFixed(1));
      bufferExplanation = `Savings cover only ${bufferMonths.toFixed(1)} months of expenses. Target is 3+ months.`;
    } else {
      bufferScore = 0;
      bufferExplanation = `Negative or zero net savings. Emergency savings buffer is unavailable.`;
    }

    components.push({
      name: 'Emergency Buffer',
      score: bufferScore,
      maxScore: 15,
      explanation: bufferExplanation,
      status: 'active'
    });
  } else {
    components.push({
      name: 'Emergency Buffer',
      score: 15,
      maxScore: 15,
      explanation: 'No historical expenses recorded yet. Buffer score is at maximum.',
      status: 'active'
    });
  }

  // Calculate normalized overall score
  const activeComponents = components.filter(c => c.status === 'active');
  const sumScores = activeComponents.reduce((sum, c) => sum + c.score, 0);
  const sumMaxScores = activeComponents.reduce((sum, c) => sum + c.maxScore, 0);

  const rawScore = sumMaxScores > 0 ? (sumScores / sumMaxScores) * 100 : 0;
  const score = Math.round(rawScore);

  return {
    score,
    components
  };
};

// GET /api/analytics/financial-health
router.get('/analytics/financial-health', authenticateToken, async (req, res) => {
  try {
    const { period = 'current-month', startDate, endDate } = req.query;
    const userId = req.user.userId;

    let periods;
    try {
      periods = getThreePeriods(period, startDate, endDate);
    } catch (dateError) {
      return res.status(400).json({ error: dateError.message });
    }

    const curStart = periods.current.start;
    const curEnd = periods.current.end;
    const prevStart = periods.previous.start;
    const prevEnd = periods.previous.end;
    const prePrevStart = periods.prePrevious.start;
    const prePrevEnd = periods.prePrevious.end;

    const [
      currentTransactions, 
      previousTransactions, 
      prePreviousTransactions,
      allTransactions, 
      goals, 
      budgets
    ] = await Promise.all([
      prisma.transaction.findMany({ where: { userId, date: { gte: curStart, lte: curEnd } } }),
      prisma.transaction.findMany({ where: { userId, date: { gte: prevStart, lte: prevEnd } } }),
      prisma.transaction.findMany({ where: { userId, date: { gte: prePrevStart, lte: prePrevEnd } } }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } })
    ]);

    // Format all transaction amounts to Float for consistency
    const formatTx = (txList) => txList.map(t => ({
      ...t,
      amount: parseFloat(t.amount)
    }));

    const curTx = formatTx(currentTransactions);
    const prevTx = formatTx(previousTransactions);
    const prePrevTx = formatTx(prePreviousTransactions);
    const allTx = formatTx(allTransactions);

    // Calculate current health score
    const currentResult = calculateFinancialHealth(curTx, prevTx, allTx, budgets, goals);

    // Calculate previous health score
    const allTxAsOfPrevious = allTx.filter(t => t.date <= prevEnd);
    const previousResult = calculateFinancialHealth(prevTx, prePrevTx, allTxAsOfPrevious, budgets, goals);

    const currentScore = currentResult.score;
    const previousScore = previousResult.score;
    const scoreChange = previousScore !== null ? currentScore - previousScore : null;

    let grade = 'Fair';
    if (currentScore >= 85) grade = 'Excellent';
    else if (currentScore >= 70) grade = 'Good';
    else if (currentScore >= 50) grade = 'Fair';
    else grade = 'Needs Attention';

    // Recommendations
    const recommendations = [];
    const savingsComp = currentResult.components.find(c => c.name === 'Savings Rate');
    const budgetComp = currentResult.components.find(c => c.name === 'Budget Discipline');
    const stabilityComp = currentResult.components.find(c => c.name === 'Expense Stability');
    const goalComp = currentResult.components.find(c => c.name === 'Goal Progress');
    const bufferComp = currentResult.components.find(c => c.name === 'Emergency Buffer');

    if (savingsComp && savingsComp.score < 15) {
      recommendations.push('Consider cutting down on dining out or entertainment variable expenses to boost your monthly savings rate.');
    }
    if (budgetComp && budgetComp.status === 'active' && budgetComp.score < 20) {
      recommendations.push('You exceeded some category budgets. Review your category limits and set alerts to control overspending.');
    }
    if (stabilityComp && stabilityComp.status === 'active' && stabilityComp.score < 15) {
      recommendations.push('Your spending rose significantly this period. Focus on stabilizing discretionary purchases.');
    }
    if (goalComp && goalComp.status === 'active' && goalComp.score < 10) {
      recommendations.push('Track your progress towards savings goals and allocate a portion of your income directly to them on payday.');
    }
    if (bufferComp && bufferComp.score < 10) {
      recommendations.push('Create an Emergency Fund goal and aim to save at least 3 months of basic living expenses for financial safety.');
    }

    if (recommendations.length === 0 && currentScore >= 85) {
      recommendations.push('Great job! Keep up the healthy habits by maintaining your budget discipline and savings buffer.');
    }

    res.json({
      score: currentScore,
      previousScore,
      change: scoreChange,
      grade,
      components: currentResult.components,
      recommendations
    });

  } catch (error) {
    return handleRouteError(res, error, 'Financial Health Score');
  }
});

// Helper to compute next date based on daily, weekly, monthly, or yearly frequency
const calculateNextOccurrence = (currentDateStr, frequency) => {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (frequency === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to batch process due occurrences safely and idempotently
const processRecurringTransactions = async (userId, targetDateStr = null) => {
  const todayStr = targetDateStr || new Date().toISOString().slice(0, 10);
  
  const dueItems = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextOccurrence: { lte: todayStr }
    }
  });

  const generated = [];

  for (const item of dueItems) {
    if (item.lastProcessedDate === item.nextOccurrence) {
      const updatedNext = calculateNextOccurrence(item.nextOccurrence, item.frequency);
      
      let stillActive = true;
      if (item.endDate && updatedNext > item.endDate) stillActive = false;
      if (item.cancellationDate && updatedNext > item.cancellationDate) stillActive = false;

      await prisma.recurringTransaction.update({
        where: { id: item.id },
        data: {
          nextOccurrence: updatedNext,
          isActive: stillActive
        }
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const createdTx = await tx.transaction.create({
        data: {
          amount: item.amount,
          type: item.type,
          category: item.category,
          note: item.notes ? `${item.notes} (Recurring: ${item.name})` : `Recurring payment: ${item.name}`,
          date: item.nextOccurrence,
          userId: item.userId
        }
      });

      const updatedNext = calculateNextOccurrence(item.nextOccurrence, item.frequency);
      
      let stillActive = true;
      if (item.endDate && updatedNext > item.endDate) stillActive = false;
      if (item.cancellationDate && updatedNext > item.cancellationDate) stillActive = false;

      await tx.recurringTransaction.update({
        where: { id: item.id },
        data: {
          lastProcessedDate: item.nextOccurrence,
          nextOccurrence: updatedNext,
          isActive: stillActive
        }
      });

      generated.push(createdTx);
    });
  }

  return generated;
};

// GET /api/recurring
router.get('/recurring', authenticateToken, async (req, res) => {
  try {
    const { isSubscription } = req.query;
    const where = { userId: req.user.userId };
    if (isSubscription !== undefined) {
      where.isSubscription = isSubscription === 'true';
    }
    const items = await prisma.recurringTransaction.findMany({
      where,
      orderBy: { nextOccurrence: 'asc' }
    });
    const formatted = items.map(item => ({
      ...item,
      amount: parseFloat(item.amount)
    }));
    res.json(formatted);
  } catch (error) {
    return handleRouteError(res, error, 'Recurring fetch');
  }
});

// POST /api/recurring
router.post('/recurring', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      amount, 
      type, 
      category, 
      frequency, 
      startDate, 
      endDate, 
      notes,
      isSubscription,
      provider,
      cancellationDate
    } = req.body;

    if (!name || !amount || parseFloat(amount) <= 0 || !type || !category || !frequency || !startDate) {
      return res.status(400).json({ error: 'Missing or invalid required parameters' });
    }

    const item = await prisma.recurringTransaction.create({
      data: {
        name,
        amount: amount.toString(),
        type,
        category,
        frequency,
        startDate,
        endDate: endDate || null,
        nextOccurrence: startDate,
        notes: notes || null,
        isSubscription: isSubscription || false,
        provider: provider || null,
        cancellationDate: cancellationDate || null,
        userId: req.user.userId
      }
    });

    res.status(201).json({
      ...item,
      amount: parseFloat(item.amount)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Recurring creation');
  }
});

// PUT /api/recurring/:id
router.put('/recurring/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      amount, 
      type, 
      category, 
      frequency, 
      startDate, 
      endDate, 
      nextOccurrence,
      notes,
      isSubscription,
      provider,
      cancellationDate,
      isActive
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (amount !== undefined) data.amount = amount.toString();
    if (type !== undefined) data.type = type;
    if (category !== undefined) data.category = category;
    if (frequency !== undefined) data.frequency = frequency;
    if (startDate !== undefined) data.startDate = startDate;
    if (endDate !== undefined) data.endDate = endDate || null;
    if (nextOccurrence !== undefined) data.nextOccurrence = nextOccurrence;
    if (notes !== undefined) data.notes = notes || null;
    if (isSubscription !== undefined) data.isSubscription = isSubscription;
    if (provider !== undefined) data.provider = provider || null;
    if (cancellationDate !== undefined) data.cancellationDate = cancellationDate || null;
    if (isActive !== undefined) data.isActive = isActive;

    const item = await prisma.recurringTransaction.update({
      where: { id: parseInt(id), userId: req.user.userId },
      data
    });

    res.json({
      ...item,
      amount: parseFloat(item.amount)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Recurring update');
  }
});

// DELETE /api/recurring/:id
router.delete('/recurring/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.recurringTransaction.delete({
      where: { id: parseInt(id), userId: req.user.userId }
    });
    res.json({ message: 'Recurring transaction deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Recurring delete');
  }
});

// POST /api/recurring/process
router.post('/recurring/process', authenticateToken, async (req, res) => {
  try {
    const { date } = req.body;
    const userId = req.user.userId;
    
    const generated = await processRecurringTransactions(userId, date);
    
    res.json({
      message: `Processed due occurrences. Generated ${generated.length} actual transactions.`,
      generatedCount: generated.length,
      transactions: generated.map(t => ({
        ...t,
        amount: parseFloat(t.amount)
      }))
    });
  } catch (error) {
    return handleRouteError(res, error, 'Recurring process');
  }
});

// GET /api/analytics/anomalies - Retrieve all spending anomalies
router.get('/analytics/anomalies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const anomalies = await prisma.transaction.findMany({
      where: { userId, isAnomaly: true },
      orderBy: { date: 'desc' }
    });
    
    const formatted = anomalies.map(t => ({
      ...t,
      amount: parseFloat(t.amount)
    }));

    res.json(formatted);
  } catch (error) {
    return handleRouteError(res, error, 'Anomalies fetch');
  }
});

// Helper function to check and generate budget, recurring, subscription, goals, and anomaly alerts
const checkAndGenerateAlerts = async (userId) => {
  try {
    const today = new Date();
    const curMonthStr = today.toISOString().slice(0, 7);

    // 1. Budgets Alerts
    const budgets = await prisma.budget.findMany({ where: { userId } });
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { startsWith: curMonthStr }, type: 'expense' }
    });

    for (const b of budgets) {
      const spent = transactions
        .filter(t => t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const limit = parseFloat(b.limit);
      if (limit <= 0) continue;
      const percentageUsed = (spent / limit) * 100;

      let type = 'budget_warning';
      let title = '';
      let message = '';
      let threshold = 0;

      if (percentageUsed >= 100) {
        type = 'budget_exceeded';
        title = `Budget Exceeded: ${b.category}`;
        message = `You spent ₹${spent.toLocaleString('en-IN')} exceeding your budget limit of ₹${limit.toLocaleString('en-IN')}.`;
        threshold = 100;
      } else if (percentageUsed >= 90) {
        title = `High Alert: ${b.category} Budget`;
        message = `You have used ${percentageUsed.toFixed(0)}% of your ₹${limit.toLocaleString('en-IN')} budget limit.`;
        threshold = 90;
      } else if (percentageUsed >= 75) {
        title = `Warning: ${b.category} Budget`;
        message = `You have used ${percentageUsed.toFixed(0)}% of your ₹${limit.toLocaleString('en-IN')} budget limit.`;
        threshold = 75;
      } else if (percentageUsed >= 50) {
        title = `Info: ${b.category} Budget`;
        message = `You have used ${percentageUsed.toFixed(0)}% of your ₹${limit.toLocaleString('en-IN')} budget limit.`;
        threshold = 50;
      }

      if (threshold > 0) {
        const refId = `budget-${b.id}-${threshold}`;
        await prisma.notification.upsert({
          where: { userId_refId: { userId, refId } },
          update: {}, // do nothing if exists, prevents duplicate
          create: { userId, type, title, message, refId }
        });
      }
    }

    // 2. Upcoming Recurring & Subscription Alerts
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    const threeDaysLaterStr = `${threeDaysLater.getFullYear()}-${String(threeDaysLater.getMonth() + 1).padStart(2, '0')}-${String(threeDaysLater.getDate()).padStart(2, '0')}`;
    const todayStr = today.toISOString().slice(0, 10);

    const recurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextOccurrence: { gte: todayStr, lte: threeDaysLaterStr }
      }
    });

    for (const item of recurring) {
      const type = item.isSubscription ? 'upcoming_subscription' : 'upcoming_recurring';
      const title = item.isSubscription ? 'Upcoming Subscription Renewal' : 'Upcoming Scheduled Bill';
      const message = `Your ${item.isSubscription ? 'subscription' : 'scheduled bill'} for ${item.name} of ₹${parseFloat(item.amount).toLocaleString('en-IN')} is due on ${item.nextOccurrence}.`;
      const refId = `recurring-${item.id}-${item.nextOccurrence}`;

      await prisma.notification.upsert({
        where: { userId_refId: { userId, refId } },
        update: {},
        create: { userId, type, title, message, refId }
      });
    }

    // 3. Goal Milestones
    const goals = await prisma.goal.findMany({ where: { userId } });
    for (const g of goals) {
      const target = parseFloat(g.targetAmount);
      const current = parseFloat(g.currentAmount);
      if (target <= 0) continue;
      const progress = (current / target) * 100;

      let title = '';
      let message = '';
      let milestone = 0;

      if (progress >= 100) {
        title = `Goal Achieved: ${g.title}`;
        message = `Congratulations! You have reached 100% of your ₹${target.toLocaleString('en-IN')} target for ${g.title}!`;
        milestone = 100;
      } else if (progress >= 90) {
        title = `Almost There: ${g.title}`;
        message = `You have reached ${progress.toFixed(0)}% of your ₹${target.toLocaleString('en-IN')} target for ${g.title}.`;
        milestone = 90;
      } else if (progress >= 50) {
        title = `Halfway Milestone: ${g.title}`;
        message = `You have reached ${progress.toFixed(0)}% of your ₹${target.toLocaleString('en-IN')} target for ${g.title}.`;
        milestone = 50;
      }

      if (milestone > 0) {
        const refId = `goal-${g.id}-${milestone}`;
        await prisma.notification.upsert({
          where: { userId_refId: { userId, refId } },
          update: {},
          create: { userId, type: 'goal_milestone', title, message, refId }
        });
      }
    }

    // 4. Unusual Spending Alerts
    const anomalies = await prisma.transaction.findMany({
      where: { userId, isAnomaly: true }
    });
    for (const tx of anomalies) {
      const refId = `anomaly-${tx.id}`;
      await prisma.notification.upsert({
        where: { userId_refId: { userId, refId } },
        update: {},
        create: {
          userId,
          type: 'unusual_spending',
          title: 'Unusual Spending Detected',
          message: `Unusual spend of ₹${parseFloat(tx.amount).toLocaleString('en-IN')} in category ${tx.category} on ${tx.date}. ${tx.anomalyReason}`,
          refId
        }
      });
    }

  } catch (err) {
    console.error('Error generating alerts:', err.message);
  }
};

// GET /api/notifications - Fetch all user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Trigger fresh checks before returning
    await checkAndGenerateAlerts(userId);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    return handleRouteError(res, error, 'Notifications fetch');
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const updated = await prisma.notification.update({
      where: { id: parseInt(id), userId },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (error) {
    return handleRouteError(res, error, 'Notification read update');
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return handleRouteError(res, error, 'Notifications mark all read');
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await prisma.notification.delete({
      where: { id: parseInt(id), userId }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Notification delete');
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.notification.deleteMany({
      where: { userId }
    });

    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Notifications clear');
  }
});

// GET /api/health - Health check status
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    console.error('Healthcheck database error:', error.message);
    res.status(500).json({
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Disconnected'
    });
  }
});

// GET /api/openapi.json - OpenAPI Spec
router.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'MoneyMind API Documentation',
      version: '1.0.0',
      description: 'Production-grade personal finance management API spec.'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Retrieve server status and database connectivity',
          responses: {
            200: { description: 'Success' }
          }
        }
      },
      '/api/transactions': {
        get: {
          summary: 'List user transactions with sorting and pagination',
          responses: {
            200: { description: 'List of transactions' }
          }
        },
        post: {
          summary: 'Create a new transaction (runs automatic categorization and anomaly checks)',
          responses: {
            201: { description: 'Created successfully' }
          }
        }
      },
      '/api/budgets': {
        get: {
          summary: 'Fetch category budgets with forecasts and daily rates',
          responses: {
            200: { description: 'List of budgets' }
          }
        }
      }
    }
  });
});

// GET /api/docs - Serve Swagger-UI HTML page using CDN
router.get('/docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MoneyMind API Specs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
  `);
});

export default router;
