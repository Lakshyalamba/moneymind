import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Clean deterministic rule-based advice fallback using aggregated context details
 */
function buildLocalFinancialAdvice(userMessage, financialContext) {
    const normalizedMessage = userMessage.toLowerCase();
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

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Get financial advice from Gemini AI using structured system guidelines
 */
export async function getFinancialAdvice(userMessage, financialContext) {
    const genAI = getGeminiClient();

    if (!genAI) {
        return buildLocalFinancialAdvice(userMessage, financialContext);
    }

    let lastError = null;

    try {
        const prompt = `You are a helpful, professional, and knowledgeable AI personal finance advisor for the MoneyMind platform.
You have secure access to the user's real, aggregated financial summary.

User's Real Financial Summary:
${JSON.stringify(financialContext, null, 2)}

User's Question: ${userMessage}

INSTRUCTIONS & CONSTRAINTS:
1. Base your answer STRICTLY on the user's provided financial summary.
2. Clearly distinguish between facts (e.g. actual numbers, savings rates, budgets exceeded) and general suggestions.
3. Do NOT fabricate, invent, or hallucinate financial numbers. If the data is missing or incomplete, explicitly say that you do not have access to that information.
4. Provide safe, practical educational personal finance suggestions (e.g. cutting discretionary spending, building emergency buffers).
5. Never promise specific investment returns, make speculative market predictions, or give guaranteed financial outcomes.
6. Keep your response SHORT, ACTIONABLE, and CONCISE - maximum 3 sentences. No lengthy greetings or unnecessary text.`;

        for (const modelName of GEMINI_MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                
                // Set a 6-second timeout for the fetch/API call using abort signal if supported, 
                // or race Promise.
                const generatePromise = model.generateContent(prompt);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Gemini API call timed out')), 6000)
                );

                const result = await Promise.race([generatePromise, timeoutPromise]);
                const response = await result.response;
                const text = response.text();

                if (text?.trim()) {
                    return text.trim();
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
        console.error('Gemini fallback to local advice due to api failure:', lastError.message);
    }

    return buildLocalFinancialAdvice(userMessage, financialContext);
}
