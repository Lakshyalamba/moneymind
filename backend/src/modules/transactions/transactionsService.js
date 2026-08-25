import { PrismaClient } from '@prisma/client';
import categorizationEngine, { GLOBAL_CATEGORIES } from './categorization/CategorizationEngine.js';
import adapterRegistry from './adapters/AdapterRegistry.js';
import { dispatchEvent } from '../webhooks/webhookService.js';

const prisma = new PrismaClient();

export { GLOBAL_CATEGORIES };

export const getMerchantKeyword = (note) => {
  if (!note) return null;
  const clean = note.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.length > 2 ? clean : null;
};

export const runLayeredCategorization = async (userId, note) => {
  const result = await categorizationEngine.categorize(userId, note);
  return result.category;
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
  const tx = await prisma.transaction.findFirst({
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

  const result = { ...transaction, amount: parseFloat(transaction.amount) };
  await dispatchEvent(userId, 'transaction.created', result);
  return result;
};

export const updateTransaction = async (transactionId, userId, txData) => {
  const { amount, type, category: reqCategory, note, date } = txData;
  const existing = await prisma.transaction.findFirst({
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
    where: { id: existing.id },
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

  const result = { ...updated, amount: parseFloat(updated.amount) };
  await dispatchEvent(userId, 'transaction.updated', result);
  return result;
};

export const deleteTransaction = async (transactionId, userId) => {
  const existing = await prisma.transaction.findFirst({
    where: { id: parseInt(transactionId), userId }
  });
  if (!existing) {
    return null;
  }
  const deleted = await prisma.transaction.delete({
    where: { id: existing.id }
  });
  await dispatchEvent(userId, 'transaction.deleted', { id: existing.id });
  return deleted;
};

export const exportTransactionsData = async (userId, format) => {
  const exporter = adapterRegistry.getExporter(format);
  if (!exporter) {
    throw new Error(`Unsupported export format: "${format}"`);
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  return exporter.export(transactions);
};

export const previewImportData = async (userId, format, fileContent) => {
  if (!fileContent || fileContent.length === 0) {
    throw new Error('Upload content is empty');
  }

  // Enforce a maximum file size of 5MB to prevent memory exhaustion
  if (fileContent.length > 5 * 1024 * 1024) {
    throw new Error('Uploaded file exceeds size limit of 5MB');
  }

  const importer = adapterRegistry.getImporter(format);
  if (!importer) {
    throw new Error(`Unsupported import format: "${format}"`);
  }

  const parsed = importer.parse(fileContent);

  // Fetch current user transactions to perform duplicate checking
  const currentTransactions = await prisma.transaction.findMany({
    where: { userId }
  });

  const validTransactions = [];
  const errors = [];
  let potentialDuplicatesCount = 0;

  parsed.forEach((tx, idx) => {
    try {
      // Duplicate detection logic (exact match of date, amount, type, and category)
      const isDuplicate = currentTransactions.some(ctx => 
        parseFloat(ctx.amount) === parseFloat(tx.amount) &&
        ctx.type === tx.type &&
        ctx.date === tx.date &&
        ctx.category.toLowerCase() === tx.category.toLowerCase()
      );

      validTransactions.push({
        ...tx,
        isDuplicate
      });

      if (isDuplicate) {
        potentialDuplicatesCount++;
      }
    } catch (err) {
      errors.push(`Row #${idx + 1}: ${err.message}`);
    }
  });

  const detectedColumns = ['amount', 'type', 'category', 'date', 'note'];

  return {
    totalRows: parsed.length,
    validRows: validTransactions.length,
    invalidRows: errors.length,
    detectedColumns,
    potentialDuplicatesCount,
    validTransactions,
    errors
  };
};

export const confirmImportTransactions = async (userId, transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw new Error('No transactions provided for confirmation');
  }

  const createdList = [];

  // Iterate and create transactions sequentially so that we run anomaly checks and personalized learning rules
  for (const txData of transactions) {
    const created = await createTransaction(userId, {
      amount: parseFloat(txData.amount),
      type: txData.type,
      category: txData.category,
      note: txData.note || '',
      date: txData.date
    });
    createdList.push(created);
  }

  return createdList;
};
