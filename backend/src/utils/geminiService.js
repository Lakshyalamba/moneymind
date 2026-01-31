import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get financial advice from Gemini AI based on user's financial data
 * @param {string} userMessage - The user's question or message
 * @param {Object} financialContext - User's financial summary
 * @returns {Promise<string>} - AI-generated advice
 */
export async function getFinancialAdvice(userMessage, financialContext) {
    try {
        // Initialize the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Build a structured prompt combining financial data with user question
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

        // Generate content from Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error('Gemini API error:', error);

        // Handle specific error cases
        if (error.message?.includes('API key')) {
            throw new Error('AI service configuration error. Please contact support.');
        }

        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            throw new Error('AI service is temporarily busy. Please try again in a moment.');
        }

        throw new Error('Unable to generate AI response. Please try again.');
    }
}
