import { PrismaClient } from '@prisma/client';
import { getPeriods, getThreePeriods, formatDate } from '../../shared/utils/date.js';

const prisma = new PrismaClient();

export const calculateFinancialHealth = (current, previous, allTime, budgets, goals) => {
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
      bufferExplanation = 'Negative or zero net savings. Emergency savings buffer is unavailable.';
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

export const fetchAnalyticsData = async (userId, queryParams) => {
  const { period = 'current-month', startDate, endDate } = queryParams;
  const periods = getPeriods(period, startDate, endDate);

  const curStart = periods.current.start;
  const curEnd = periods.current.end;
  const prevStart = periods.previous.start;
  const prevEnd = periods.previous.end;

  const [currentTransactions, previousTransactions, allTransactions, goals, budgets] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, date: { gte: curStart, lte: curEnd } } }),
    prisma.transaction.findMany({ where: { userId, date: { gte: prevStart, lte: prevEnd } } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId } })
  ]);

  const formatTx = (txList) => txList.map(t => ({
    ...t,
    amount: parseFloat(t.amount)
  }));

  const curTx = formatTx(currentTransactions);
  const prevTx = formatTx(previousTransactions);
  const allTx = formatTx(allTransactions);

  const totalIncome = curTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = curTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const prevIncome = prevTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const prevSavings = prevIncome - prevExpense;

  const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null;
  const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null;
  const savingsChange = prevSavings !== 0 ? ((netSavings - prevSavings) / Math.abs(prevSavings)) * 100 : null;

  const allTimeIncome = allTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const allTimeExpense = allTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netWorth = allTimeIncome - allTimeExpense;

  const categorySpending = {};
  curTx.filter(t => t.type === 'expense').forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });

  const categoryBreakdown = Object.entries(categorySpending).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  const topCategories = categoryBreakdown.slice(0, 5);

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

  const numDays = dailyTrend.length;
  const averageDailySpending = numDays > 0 ? totalExpense / numDays : 0;

  const sDate = new Date(curStart);
  const eDate = new Date(curEnd);
  const numMonths = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth()) + 1;
  const averageMonthlySpending = numMonths > 0 ? totalExpense / numMonths : 0;

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

  const goalProgress = goals.map(g => {
    const target = parseFloat(g.targetAmount);
    const currentVal = parseFloat(g.currentAmount);
    return {
      id: g.id,
      title: g.title,
      targetAmount: target,
      currentAmount: currentVal,
      percentage: target > 0 ? (currentVal / target) * 100 : 0,
      deadline: g.deadline
    };
  });

  const insights = [];
  if (savingsRate > 20) {
    insights.push(`Your savings rate is ${savingsRate.toFixed(1)}% this period, which is higher than the recommended 20% budget benchmark.`);
  } else if (savingsRate > 0) {
    insights.push(`Your savings rate is ${savingsRate.toFixed(1)}% this period. Consider reducing variable expenses to reach the recommended 20% benchmark.`);
  } else {
    insights.push('You spent more than you earned this period. Review your top spending categories to identify areas to cut back.');
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

  return {
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
  };
};

export const fetchFinancialHealthScore = async (userId, queryParams) => {
  const { period = 'current-month', startDate, endDate } = queryParams;
  const periods = getThreePeriods(period, startDate, endDate);

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

  const formatTx = (txList) => txList.map(t => ({
    ...t,
    amount: parseFloat(t.amount)
  }));

  const curTx = formatTx(currentTransactions);
  const prevTx = formatTx(previousTransactions);
  const prePrevTx = formatTx(prePreviousTransactions);
  const allTx = formatTx(allTransactions);

  const currentResult = calculateFinancialHealth(curTx, prevTx, allTx, budgets, goals);

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

  return {
    score: currentScore,
    previousScore,
    change: scoreChange,
    grade,
    components: currentResult.components,
    recommendations
  };
};

export const fetchAnomalies = async (userId) => {
  const anomalies = await prisma.transaction.findMany({
    where: { userId, isAnomaly: true },
    orderBy: { date: 'desc' }
  });
  return anomalies.map(t => ({
    ...t,
    amount: parseFloat(t.amount)
  }));
};
