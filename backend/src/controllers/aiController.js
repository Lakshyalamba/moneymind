import { PrismaClient } from '@prisma/client';
import { getFinancialAdvice } from '../utils/geminiService.js';

const prisma = new PrismaClient();

/**
 * Handle AI chat requests
 * Fetches user's financial data and sends it to Gemini AI for personalized advice
 */
export async function chatWithAI(req, res) {
    try {
        const { message } = req.body;
        const userId = req.user.userId;

        // Validate user message
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const today = new Date();
        const curMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

        // Fetch user data in parallel
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

        // Aggregate current and previous month transactions
        const curMonthTx = transactions.filter(t => t.date.startsWith(curMonthStr));
        const prevMonthTx = transactions.filter(t => t.date.startsWith(prevMonthStr));

        // Income, expenses, and savings
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

        // Budgets utilization breakdown
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

        // Goals progress breakdown
        const goalSummary = goals.map(g => ({
            title: g.title,
            targetAmount: parseFloat(g.targetAmount),
            currentAmount: parseFloat(g.currentAmount),
            progressPercent: parseFloat(g.targetAmount) > 0 ? (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100 : 0,
            deadline: g.deadline
        }));

        // Recurring items and subscriptions
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

        // Compile clean, non-sensitive financial context
        const financialContext = {
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

        // Fetch advice from Gemini service
        const aiResponse = await getFinancialAdvice(message, financialContext);

        // Return structured response
        res.json({
            success: true,
            message: aiResponse,
            context: {
                income: curIncome,
                expenses: curExpense,
                savings: curSavings
            }
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate AI response. Please try again.'
        });
    }
}
