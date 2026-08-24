import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fetchBudgetsWithForecast = async (userId) => {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { category: 'asc' }
  });

  const today = new Date();
  const curYear = today.getFullYear();
  const curMonth = today.getMonth();
  const curMonthStr = today.toISOString().slice(0, 7);
  
  const totalDaysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const daysElapsed = today.getDate();
  const daysRemaining = totalDaysInMonth - daysElapsed;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { startsWith: curMonthStr },
      type: 'expense'
    }
  });

  return budgets.map(b => {
    const categoryTx = transactions.filter(t => t.category.toLowerCase() === b.category.toLowerCase());
    const spent = categoryTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const limit = parseFloat(b.limit);
    const remaining = limit - spent;
    const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;

    let averageDailySpending = 0;
    let projectedSpending = 0;
    let expectedDeficit = 0;
    let forecastConfidence = 'Low';
    let hasData = false;

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
};

export const createOrUpdateBudget = async (userId, budgetData) => {
  const { category, limit } = budgetData;

  const budget = await prisma.budget.upsert({
    where: {
      userId_category: {
        userId,
        category
      }
    },
    update: {
      limit: limit.toString()
    },
    create: {
      userId,
      category,
      limit: limit.toString()
    }
  });

  return { ...budget, limit: parseFloat(budget.limit) };
};

export const deleteBudget = async (budgetId, userId) => {
  const existing = await prisma.budget.findUnique({
    where: { id: parseInt(budgetId), userId }
  });
  if (!existing) {
    return null;
  }
  return prisma.budget.delete({
    where: { id: parseInt(budgetId), userId }
  });
};
