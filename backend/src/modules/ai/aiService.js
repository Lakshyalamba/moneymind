import { PrismaClient } from '@prisma/client';
import aiProviderFactory from './providers/ProviderFactory.js';
import FallbackAIProvider from './providers/FallbackAIProvider.js';

const prisma = new PrismaClient();

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Strips PII (emails, phone numbers) from text strings.
 */
export function sanitizePII(text) {
  if (typeof text !== 'string') return text;
  
  // Strip emails
  let clean = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  // Strip standard phone numbers (6-15 digits with optional symbols)
  clean = clean.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,}/g, '[PHONE]');
  
  return clean;
}

/**
 * Programmatically sanitizes all text values in a financial context object.
 */
export function sanitizeFinancialContext(obj) {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return sanitizePII(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFinancialContext(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeFinancialContext(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

export function buildLocalFinancialAdvice(userMessage, financialContext) {
  const fallback = new FallbackAIProvider();
  // Call synchronous contextual advisor
  // We use this logic directly
  const cur = financialContext.currentMonth;
  const balance = cur.savings;
  const sortedBudgets = [...financialContext.budgets].sort((a, b) => b.spent - a.spent);
  const topCategory = sortedBudgets.length > 0 ? sortedBudgets[0].category : 'None';
  const advice = [];

  if (cur.income === 0 && cur.expenses === 0) {
    advice.push('I do not see any financial activity yet. Start by adding your income and usual monthly expenses.');
  } else if (balance < 0) {
    advice.push(`Your monthly expenses exceed earnings by ${formatCurrency(Math.abs(balance))}. Consider capping spending in ${topCategory}.`);
  } else {
    advice.push(`You have a positive savings of ${formatCurrency(balance)} (savings rate: ${cur.savingsRate}%). Protect this by auto-saving part of it.`);
  }

  const normalizedMessage = userMessage.toLowerCase();
  if (normalizedMessage.includes('budget') || normalizedMessage.includes('limit')) {
    const exceeded = financialContext.budgets.filter(b => b.exceeded);
    if (exceeded.length > 0) {
      advice.push(`Warning: You have exceeded budgets for ${exceeded.map(e => e.category).join(', ')}.`);
    } else {
      advice.push('Great job keeping all your active category budgets within limits this month.');
    }
  } else if (normalizedMessage.includes('save') || normalizedMessage.includes('goal')) {
    if (financialContext.goals.length > 0) {
      const lowGoal = financialContext.goals.sort((a, b) => a.progressPercent - b.progressPercent)[0];
      advice.push(`Focus on savings goal "${lowGoal.title}" which is currently at ${lowGoal.progressPercent.toFixed(0)}% completion.`);
    } else {
      advice.push('Consider setting up savings goals to automatically track targets and deadlines.');
    }
  } else if (normalizedMessage.includes('subscription') || normalizedMessage.includes('recurring')) {
    if (financialContext.subscriptions.length > 0) {
      const count = financialContext.subscriptions.length;
      const subCost = financialContext.subscriptions.reduce((sum, s) => sum + s.amount, 0);
      advice.push(`You have ${count} active subscriptions costing ${formatCurrency(subCost)} monthly. Review these to prune unused ones.`);
    } else {
      advice.push('No active subscriptions configured. Add them to monitor merchant renewals.');
    }
  }

  return advice.slice(0, 2).join(' ');
}

export async function getFinancialAdvice(userMessage, financialContext) {
  // 1. Sanitize user data to remove PII
  const cleanMessage = sanitizePII(userMessage);
  const cleanContext = sanitizeFinancialContext(financialContext);

  // 2. Load the active AI Provider from the factory
  const provider = aiProviderFactory.getProvider();

  // 3. Fallback check
  if (provider instanceof FallbackAIProvider) {
    return buildLocalFinancialAdvice(cleanMessage, cleanContext);
  }

  try {
    const prompt = `You are a helpful, professional, and knowledgeable AI personal finance advisor for the MoneyMind platform.
You have secure access to the user's real, aggregated financial summary.

User's Real Financial Summary:
${JSON.stringify(cleanContext, null, 2)}

User's Question: ${cleanMessage}

INSTRUCTIONS & CONSTRAINTS:
1. Base your answer STRICTLY on the user's provided financial summary.
2. Clearly distinguish between facts (e.g. actual numbers, savings rates, budgets exceeded) and general suggestions.
3. Do NOT fabricate, invent, or hallucinate financial numbers. If the data is missing or incomplete, explicitly say that you do not have access to that information.
4. Provide safe, practical educational personal finance suggestions (e.g. cutting discretionary spending, building emergency buffers).
5. Never promise specific investment returns, make speculative market predictions, or give guaranteed financial outcomes.
6. Keep your response SHORT, ACTIONABLE, and CONCISE - maximum 3 sentences. No lengthy greetings or unnecessary text.`;

    const system = 'You are a professional personal finance advisor.';
    const textResponse = await provider.generateResponse(prompt, system);

    if (textResponse) {
      return textResponse;
    }
  } catch (err) {
    console.error('[aiService]: Provider failed, falling back to local advisor:', err.message);
  }

  // Fallback to local advisor if anything failed
  return buildLocalFinancialAdvice(cleanMessage, cleanContext);
}

export const aggregateFinancialContext = async (userId) => {
  const today = new Date();
  const curMonthStr = today.toISOString().slice(0, 7);
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

  const [
    transactions,
    budgets,
    goals,
    recurring
  ] = await Promise.all([
    prisma.transaction.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.recurringTransaction.findMany({ where: { userId } })
  ]);

  const curMonthTx = transactions.filter(t => t.date.startsWith(curMonthStr));
  const prevMonthTx = transactions.filter(t => t.date.startsWith(prevMonthStr));

  const curIncome = curMonthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const curExpense = curMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const curSavings = curIncome - curExpense;
  const savingsRate = curIncome > 0 ? (curSavings / curIncome) * 100 : 0;

  const prevIncome = prevMonthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const prevExpense = prevMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const budgetSummary = budgets.map(b => {
    const spent = curMonthTx
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return {
      category: b.category,
      limit: parseFloat(b.limit),
      spent,
      exceeded: spent > parseFloat(b.limit)
    };
  });

  const goalSummary = goals.map(g => ({
    title: g.title,
    targetAmount: parseFloat(g.targetAmount),
    currentAmount: parseFloat(g.currentAmount),
    progressPercent: parseFloat(g.targetAmount) > 0 ? (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100 : 0,
    deadline: g.deadline
  }));

  const activeRecurring = recurring.filter(r => r.isActive && !r.isSubscription);
  const activeSubs = recurring.filter(r => r.isActive && r.isSubscription);

  const recurringSummary = activeRecurring.map(r => ({
    name: r.name,
    amount: parseFloat(r.amount),
    frequency: r.frequency,
    nextOccurrence: r.nextOccurrence
  }));

  const subscriptionSummary = activeSubs.map(s => ({
    name: s.name,
    provider: s.provider,
    amount: parseFloat(s.amount),
    frequency: s.frequency,
    nextOccurrence: s.nextOccurrence
  }));

  return {
    currentMonth: {
      income: curIncome,
      expenses: curExpense,
      savings: curSavings,
      savingsRate: parseFloat(savingsRate.toFixed(1))
    },
    previousMonth: {
      income: prevIncome,
      expenses: prevExpense
    },
    budgets: budgetSummary,
    goals: goalSummary,
    recurringTransactions: recurringSummary,
    subscriptions: subscriptionSummary
  };
};
