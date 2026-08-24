import test from 'node:test';
import assert from 'node:assert';

// 1. Mock transactions helper to test aggregate logic locally
const calculateAnalytics = (curTx, prevTx, allTx, budgets = [], goals = [], periodDays = 30) => {
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

  let fixedExpenses = 0;
  let variableExpenses = 0;
  curTx.filter(t => t.type === 'expense').forEach(t => {
    const isFixed = ['housing', 'utilities'].includes(t.category.toLowerCase());
    if (isFixed) fixedExpenses += t.amount;
    else variableExpenses += t.amount;
  });

  const averageDailySpending = periodDays > 0 ? totalExpense / periodDays : 0;

  const budgetUtilization = budgets.map(b => {
    const spent = curTx
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      category: b.category,
      limit: b.limit,
      spent,
      percentage: b.limit > 0 ? (spent / b.limit) * 100 : 0
    };
  });

  return {
    summary: { totalIncome, totalExpense, netSavings, savingsRate, netWorth },
    comparison: { incomeChange, expenseChange, savingsChange },
    breakdowns: { fixedExpenses, variableExpenses },
    averages: { averageDailySpending },
    budgetUtilization
  };
};

test('Analytics Calculations - Correct Calculations', () => {
  const curTx = [
    { type: 'income', amount: 5000, category: 'Salary' },
    { type: 'expense', amount: 1500, category: 'Housing' }, // Fixed
    { type: 'expense', amount: 500, category: 'Food & Dining' } // Variable
  ];

  const prevTx = [
    { type: 'income', amount: 4000, category: 'Salary' },
    { type: 'expense', amount: 1000, category: 'Housing' }
  ];

  const allTx = [...curTx, ...prevTx];

  const budgets = [
    { category: 'Food & Dining', limit: 1000 },
    { category: 'Housing', limit: 2000 }
  ];

  const results = calculateAnalytics(curTx, prevTx, allTx, budgets, [], 30);

  // Assertions
  assert.strictEqual(results.summary.totalIncome, 5000);
  assert.strictEqual(results.summary.totalExpense, 2000);
  assert.strictEqual(results.summary.netSavings, 3000);
  assert.strictEqual(results.summary.savingsRate, 60);
  assert.strictEqual(results.summary.netWorth, 6000);

  // Growth calculations
  assert.strictEqual(results.comparison.incomeChange, 25); // (5000-4000)/4000 * 100 = 25%
  assert.strictEqual(results.comparison.expenseChange, 100); // (2000-1000)/1000 * 100 = 100%

  // Fixed vs Variable
  assert.strictEqual(results.breakdowns.fixedExpenses, 1500);
  assert.strictEqual(results.breakdowns.variableExpenses, 500);

  // Averages
  assert.strictEqual(results.averages.averageDailySpending, 2000 / 30);

  // Budgets
  assert.strictEqual(results.budgetUtilization[0].spent, 500);
  assert.strictEqual(results.budgetUtilization[0].percentage, 50);
  assert.strictEqual(results.budgetUtilization[1].spent, 1500);
  assert.strictEqual(results.budgetUtilization[1].percentage, 75);
});

test('Analytics Calculations - Empty History', () => {
  const results = calculateAnalytics([], [], [], [], [], 30);

  assert.strictEqual(results.summary.totalIncome, 0);
  assert.strictEqual(results.summary.totalExpense, 0);
  assert.strictEqual(results.summary.netSavings, 0);
  assert.strictEqual(results.summary.savingsRate, 0);
  assert.strictEqual(results.summary.netWorth, 0);
  assert.strictEqual(results.comparison.incomeChange, null);
  assert.strictEqual(results.comparison.expenseChange, null);
  assert.strictEqual(results.comparison.savingsChange, null);
});

test('Analytics Calculations - No Budgets', () => {
  const results = calculateAnalytics([], [], [], [], [], 30);
  assert.strictEqual(results.budgetUtilization.length, 0);
});
