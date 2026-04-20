import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function buildLocalFinancialAdvice(userMessage, financialContext) {
    const normalizedMessage = userMessage.toLowerCase();
    const savings = financialContext.balance;
    const expenseRatio = financialContext.totalIncome > 0
        ? financialContext.totalExpenses / financialContext.totalIncome
        : 0;

    const advice = [];

    if (financialContext.totalExpenses === 0 && financialContext.totalIncome === 0) {
        advice.push('I do not see any financial activity yet, so start by adding your income and usual monthly expenses to get meaningful advice.');
    } else if (savings < 0) {
        advice.push(`You are overspending by ${formatCurrency(Math.abs(savings))}, so cut back first in ${financialContext.topCategory} and pause non-essential purchases this month.`);
    } else if (expenseRatio > 0.8) {
        advice.push(`Your expenses are using most of your income, so cap spending in ${financialContext.topCategory} and move a fixed amount to savings as soon as income arrives.`);
    } else {
        advice.push(`You currently have a positive balance of ${formatCurrency(savings)}, so protect it by auto-saving part of it before increasing discretionary spending.`);
    }

    if (normalizedMessage.includes('budget')) {
        advice.push('A simple target is 50% needs, 30% wants, and 20% savings, then tighten the wants bucket if your top category keeps growing.');
    } else if (normalizedMessage.includes('save') || normalizedMessage.includes('savings')) {
        advice.push('Set an automatic transfer on payday and aim to build at least 3 months of essential expenses as your emergency fund.');
    } else if (normalizedMessage.includes('expense') || normalizedMessage.includes('spending')) {
        advice.push(`Review your recent transactions and set a weekly cap for ${financialContext.topCategory}, because that is your biggest expense driver right now.`);
    } else if (normalizedMessage.includes('healthy')) {
        advice.push(expenseRatio <= 0.7
            ? 'Your spending looks reasonably controlled relative to income, but keep monitoring recurring categories so they do not drift upward.'
            : 'Your spending is on the higher side relative to income, so you should reduce variable expenses before taking on any new commitments.');
    } else {
        advice.push(`Focus on your biggest spending area, ${financialContext.topCategory}, and review recent activity like ${financialContext.recentTransactions} to find one cut you can make this week.`);
    }

    return advice.slice(0, 2).join(' ');
}

/**
 * Get financial advice from Gemini AI based on user's financial data
 * @param {string} userMessage - The user's question or message
 * @param {Object} financialContext - User's financial summary
 * @returns {Promise<string>} - AI-generated advice
 */
export async function getFinancialAdvice(userMessage, financialContext) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        return buildLocalFinancialAdvice(userMessage, financialContext);
    }

    let lastError = null;

    try {
        const prompt = `You are a helpful and knowledgeable personal finance advisor. 

Based on the following financial data for the user, provide practical, actionable, and empathetic financial advice:

User's Financial Summary:
- Total Income: ₹${financialContext.totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${financialContext.totalExpenses.toLocaleString('en-IN')}
- Current Balance: ₹${financialContext.balance.toLocaleString('en-IN')}
- Top Spending Category: ${financialContext.topCategory || 'Not available'}
${financialContext.recentTransactions ? `- Recent Activity: ${financialContext.recentTransactions}` : ''}

User's Question: ${userMessage}

IMPORTANT: Keep your response SHORT and CRISP - maximum 2-3 sentences. Be direct and actionable. No lengthy explanations.`;

        for (const modelName of GEMINI_MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (text?.trim()) {
                    return text;
                }
            } catch (error) {
                lastError = error;
                console.error(`Gemini API error for ${modelName}:`, error);
            }
        }
    } catch (error) {
        lastError = error;
    }

    if (lastError) {
        console.error('Gemini fallback to local advice after model failures.');
    }

    return buildLocalFinancialAdvice(userMessage, financialContext);
}
