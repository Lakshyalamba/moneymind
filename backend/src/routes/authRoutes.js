import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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


router.post('/signup', async (req, res) => {
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
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
      select: { id: true, name: true, email: true, phone: true, bio: true }
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
    const { name, phone, bio } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio })
      },
      select: { id: true, name: true, email: true, phone: true, bio: true }
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

router.post('/transactions', authenticateToken, async (req, res) => {
  try {
    const { amount, type, category, note, date } = req.body;
    const transaction = await prisma.transaction.create({
      data: {
        amount: amount.toString(),
        type,
        category,
        note: note || '',
        date,
        userId: req.user.userId
      }
    });
    res.status(201).json({
      ...transaction,
      amount: parseFloat(transaction.amount)
    });
  } catch (error) {
    return handleRouteError(res, error, 'Transaction creation');
  }
});

router.put('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, note, date } = req.body;
    const transaction = await prisma.transaction.update({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      },
      data: {
        amount: amount.toString(),
        type,
        category,
        note: note || '',
        date
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

router.post('/goals', authenticateToken, async (req, res) => {
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

router.delete('/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.goal.delete({
      where: { id: parseInt(id), userId: req.user.userId }
    });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Goal delete');
  }
});

export default router;
