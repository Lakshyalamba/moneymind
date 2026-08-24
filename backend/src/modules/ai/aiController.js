import * as aiService from './aiService.js';

export async function chatWithAI(req, res) {
    try {
        const { message } = req.body;
        const userId = req.user.userId;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const financialContext = await aiService.aggregateFinancialContext(userId);
        const aiResponse = await aiService.getFinancialAdvice(message, financialContext);

        res.json({
            success: true,
            message: aiResponse,
            context: {
                income: financialContext.currentMonth.income,
                expenses: financialContext.currentMonth.expenses,
                savings: financialContext.currentMonth.savings
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
