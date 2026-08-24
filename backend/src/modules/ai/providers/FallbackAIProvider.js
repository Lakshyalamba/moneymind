import AIProvider from './AIProvider.js';

export class FallbackAIProvider extends AIProvider {
  formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  async generateResponse(prompt, systemInstruction) {
    // Basic static fallback
    return 'MoneyMind Advisor: Please configure a valid AI Provider (e.g. Gemini API Key) to get real-time tailored financial advice.';
  }

  // Allow custom fallback advice based on financial context if called through getFinancialAdvice
  async generateContextualAdvice(userMessage, financialContext) {
    const normalizedMessage = userMessage.toLowerCase();
    const cur = financialContext.currentMonth;
    const balance = cur.savings;
    const sortedBudgets = [...financialContext.budgets].sort((a, b) => b.spent - a.spent);
    const topCategory = sortedBudgets.length > 0 ? sortedBudgets[0].category : 'None';

    const advice = [];

    if (cur.income === 0 && cur.expenses === 0) {
      advice.push('I do not see any financial activity yet. Start by adding your income and usual monthly expenses.');
    } else if (balance < 0) {
      advice.push(`Your monthly expenses exceed earnings by ${this.formatCurrency(Math.abs(balance))}. Consider capping spending in ${topCategory}.`);
    } else {
      advice.push(`You have a positive savings of ${this.formatCurrency(balance)} (savings rate: ${cur.savingsRate}%). Protect this by auto-saving part of it.`);
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
        advice.push(`You have ${count} active subscriptions costing ${this.formatCurrency(subCost)} monthly. Review these to prune unused ones.`);
      } else {
        advice.push('No active subscriptions configured. Add them to monitor merchant renewals.');
      }
    }

    return advice.slice(0, 2).join(' ');
  }

  async categorizeTransaction(note, categories) {
    // Deterministic fallback: default to 'Other' or first available category
    const cleanNote = note.toLowerCase();
    if (cleanNote.includes('salary') && categories.includes('Salary')) return 'Salary';
    if (cleanNote.includes('rent') && categories.includes('Housing')) return 'Housing';
    return categories.includes('Other') ? 'Other' : categories[0];
  }

  async analyzeSpending(transactions) {
    return 'Summary: Expenses tracked. Add budgets to categorize and analyze anomalies.';
  }

  async generateInsights(financialContext) {
    return 'Emergency fund is recommended. Monitor your active subscriptions.';
  }
}
export default FallbackAIProvider;
