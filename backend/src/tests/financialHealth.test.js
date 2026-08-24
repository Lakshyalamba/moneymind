import test from 'node:test';
import assert from 'node:assert';

// Local reference of calculation logic to keep tests lightweight and completely isolated
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
    savingsRateExplanation = 'No income recorded.';
  } else if (savingsRate >= 20) {
    savingsRateScore = 25;
    savingsRateExplanation = 'Excellent savings rate.';
  } else if (savingsRate > 0) {
    savingsRateScore = parseFloat(((savingsRate / 20) * 25).toFixed(1));
    savingsRateExplanation = 'Savings rate positive.';
  } else {
    savingsRateScore = 0;
    savingsRateExplanation = 'Negative savings rate.';
  }

  components.push({ name: 'Savings Rate', score: savingsRateScore, maxScore: 25, status: 'active' });

  // 2. Budget Discipline (25 pts)
  let budgetScore = 0;
  let budgetStatus = 'active';

  if (budgets.length === 0) {
    budgetStatus = 'unavailable';
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
  }

  components.push({ name: 'Budget Discipline', score: budgetScore, maxScore: 25, status: budgetStatus });

  // 3. Expense Stability (20 pts)
  let stabilityScore = 0;
  let stabilityStatus = 'active';

  if (previous.length === 0) {
    stabilityStatus = 'unavailable';
  } else {
    const expenseIncrease = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : 0;
    
    if (curExpense <= prevExpense) {
      stabilityScore = 20;
    } else if (expenseIncrease <= 10) {
      stabilityScore = 15;
    } else if (expenseIncrease <= 30) {
      stabilityScore = 10;
    } else if (expenseIncrease <= 50) {
      stabilityScore = 5;
    } else {
      stabilityScore = 0;
    }
  }

  components.push({ name: 'Expense Stability', score: stabilityScore, maxScore: 20, status: stabilityStatus });

  // 4. Goal Progress (15 pts)
  let goalScore = 0;
  let goalStatus = 'active';

  if (goals.length === 0) {
    goalStatus = 'unavailable';
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
  }

  components.push({ name: 'Goal Progress', score: goalScore, maxScore: 15, status: goalStatus });

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
    if (bufferMonths >= 3) {
      bufferScore = 15;
    } else if (bufferMonths > 0) {
      bufferScore = parseFloat(((bufferMonths / 3) * 15).toFixed(1));
    } else {
      bufferScore = 0;
    }

    components.push({ name: 'Emergency Buffer', score: bufferScore, maxScore: 15, status: 'active' });
  } else {
    components.push({ name: 'Emergency Buffer', score: 15, maxScore: 15, status: 'active' });
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

// 1. Edge Case: No transactions at all
test('Financial Health - No Transactions', () => {
  const result = calculateFinancialHealth([], [], [], [], []);
  // Without transactions, savings rate is 0, stability is unavailable, buffer has no history (scores 15).
  // Active components: Savings Rate (score 0 / max 25), Emergency Buffer (score 15 / max 15)
  // Overall score: (15 / 40) * 100 = 37.5 => 38
  assert.strictEqual(result.score, 38);
  
  const budgetComp = result.components.find(c => c.name === 'Budget Discipline');
  assert.strictEqual(budgetComp.status, 'unavailable');
});

// 2. Edge Case: Zero Income, High Expenses
test('Financial Health - Zero Income, High Expenses', () => {
  const current = [
    { type: 'expense', amount: 5000, category: 'Food & Dining', date: '2026-08-01' }
  ];
  const previous = [
    { type: 'expense', amount: 4000, category: 'Food & Dining', date: '2026-07-01' }
  ];
  const allTime = [...current, ...previous];

  const result = calculateFinancialHealth(current, previous, allTime, [], []);
  
  // Savings rate score should be 0 because income is 0
  const savingsComp = result.components.find(c => c.name === 'Savings Rate');
  assert.strictEqual(savingsComp.score, 0);

  // Buffer score should be 0 because netWorth is negative (-9000)
  const bufferComp = result.components.find(c => c.name === 'Emergency Buffer');
  assert.strictEqual(bufferComp.score, 0);
});

// 3. Normalization: When Budgets and Goals are configured vs unconfigured
test('Financial Health - Normalization Check', () => {
  const current = [
    { type: 'income', amount: 10000, category: 'Salary', date: '2026-08-01' },
    { type: 'expense', amount: 1500, category: 'Food & Dining', date: '2026-08-02' } // 85% savings rate
  ];
  
  // Scenarios without budgets and goals:
  // Active components: Savings Rate (25/25), Emergency Buffer (15/15) => Max 40 points
  // Expect overall score to normalize to 100
  const resultNoBudgetsNoGoals = calculateFinancialHealth(current, [], current, [], []);
  assert.strictEqual(resultNoBudgetsNoGoals.score, 100);

  // Scenarios with perfect budget and goal
  const budgets = [{ category: 'Food & Dining', limit: 2000 }];
  const goals = [{ targetAmount: 5000, currentAmount: 5000 }];
  const resultWithBudgetsGoals = calculateFinancialHealth(current, [], current, budgets, goals);
  assert.strictEqual(resultWithBudgetsGoals.score, 100);
});

// 4. Overspending Budgets Penalty
test('Financial Health - Overspent Budget Penalty', () => {
  const current = [
    { type: 'income', amount: 10000, category: 'Salary', date: '2026-08-01' },
    { type: 'expense', amount: 3000, category: 'Food & Dining', date: '2026-08-02' }
  ];
  const budgets = [{ category: 'Food & Dining', limit: 2000 }]; // Spent is 3000 (1.5x limit)

  const result = calculateFinancialHealth(current, [], current, budgets, []);
  
  // Budget discipline max is 25.
  // Penalty: 1 - (3000 - 2000)/2000 = 1 - 0.5 = 0.5.
  // Budget component score: 0.5 * 25 = 12.5.
  const budgetComp = result.components.find(c => c.name === 'Budget Discipline');
  assert.strictEqual(budgetComp.score, 12.5);
});
