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

        // Fetch all user transactions to calculate financial summary
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        });

        // Calculate financial summary
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const balance = totalIncome - totalExpenses;

        // Find top spending category
        const categorySpending = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const category = t.category;
                categorySpending[category] = (categorySpending[category] || 0) + parseFloat(t.amount);
            });

        const topCategory = Object.keys(categorySpending).length > 0
            ? Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0][0]
            : 'No expenses recorded';

        // Get recent transactions summary (last 5)
        const recentTransactions = transactions.slice(0, 5).map(t =>
            `${t.type === 'income' ? '+' : '-'}₹${parseFloat(t.amount).toLocaleString('en-IN')} in ${t.category}`
        ).join(', ');

        // Build financial context object
        const financialContext = {
            totalIncome,
            totalExpenses,
            balance,
            topCategory,
            recentTransactions: recentTransactions || 'No recent transactions'
        };

        // Get AI advice
        const aiResponse = await getFinancialAdvice(message, financialContext);

        // Return response
        res.json({
            success: true,
            message: aiResponse,
            context: {
                income: totalIncome,
                expenses: totalExpenses,
                balance: balance
            }
        });

    } catch (error) {
        console.error('AI Chat error:', error);

        // Return user-friendly error message
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate AI response. Please try again.'
        });
    }
}
