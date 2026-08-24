import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

export const GLOBAL_CATEGORIES = [
  'Food & Dining', 'Salary', 'Housing', 'Utilities', 
  'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Freelance', 'Other'
];

export const GLOBAL_MERCHANT_MAP = [
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

export const getMerchantKeyword = (note) => {
  if (!note) return null;
  const clean = note.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.length > 2 ? clean : null;
};

export const runLayeredCategorization = async (userId, note) => {
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

export const learnPersonalizedRule = async (userId, note, category) => {
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

export const detectSpendingAnomaly = async (userId, category, amount) => {
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

export const fetchTransactions = async (userId, queryParams) => {
  const { search = '', filter = 'all', sortBy = 'date', sortOrder = 'desc', page = 1, limit = 7 } = queryParams;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    userId,
    ...(search && {
      OR: [
        { category: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(filter !== 'all' && { type: filter })
  };

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

  return {
    transactions: formattedTransactions,
    totalPages,
    currentPage: parseInt(page),
    totalCount
  };
};

export const findTransactionById = async (transactionId, userId) => {
  const tx = await prisma.transaction.findUnique({
    where: { id: parseInt(transactionId), userId }
  });
  if (tx) {
    return { ...tx, amount: parseFloat(tx.amount) };
  }
  return null;
};

export const createTransaction = async (userId, txData) => {
  const { amount, type, category: reqCategory, note, date } = txData;

  let category = reqCategory;
  if (!category || category === 'Other' || category === '') {
    category = await runLayeredCategorization(userId, note || '');
  }

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

  if (reqCategory && reqCategory !== 'Other' && reqCategory !== '' && note) {
    await learnPersonalizedRule(userId, note, reqCategory);
  }

  return { ...transaction, amount: parseFloat(transaction.amount) };
};

export const updateTransaction = async (transactionId, userId, txData) => {
  const { amount, type, category: reqCategory, note, date } = txData;
  const existing = await prisma.transaction.findUnique({
    where: { id: parseInt(transactionId), userId }
  });

  if (!existing) {
    return null;
  }

  let category = reqCategory || existing.category;
  if (!reqCategory || reqCategory === 'Other' || reqCategory === '') {
    category = await runLayeredCategorization(userId, note || existing.note || '');
  }

  if (reqCategory && reqCategory !== 'Other' && reqCategory !== '' && note) {
    await learnPersonalizedRule(userId, note, reqCategory);
  }

  let isAnomaly = existing.isAnomaly;
  let anomalyReason = existing.anomalyReason;
  if (amount && parseFloat(amount) !== parseFloat(existing.amount) && (type || existing.type) === 'expense') {
    const anomalyResult = await detectSpendingAnomaly(userId, category, parseFloat(amount));
    isAnomaly = anomalyResult.isAnomaly;
    anomalyReason = anomalyResult.anomalyReason;
  }

  const updated = await prisma.transaction.update({
    where: { id: parseInt(transactionId), userId },
    data: {
      ...(amount && { amount: amount.toString() }),
      ...(type && { type }),
      category,
      ...(note !== undefined && { note }),
      ...(date && { date }),
      isAnomaly,
      anomalyReason
    }
  });

  return { ...updated, amount: parseFloat(updated.amount) };
};

export const deleteTransaction = async (transactionId, userId) => {
  const existing = await prisma.transaction.findUnique({
    where: { id: parseInt(transactionId), userId }
  });
  if (!existing) {
    return null;
  }
  return prisma.transaction.delete({
    where: { id: parseInt(transactionId), userId }
  });
};
