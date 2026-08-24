import UserDefinedCategorizer from './UserDefinedCategorizer.js';
import GlobalMerchantRuleCategorizer from './GlobalMerchantRuleCategorizer.js';
import AICategorizer from './AICategorizer.js';

export const GLOBAL_CATEGORIES = [
  'Food & Dining', 'Salary', 'Housing', 'Utilities', 
  'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Freelance', 'Other'
];

export class CategorizationEngine {
  constructor() {
    this.categorizers = [
      new UserDefinedCategorizer(),
      new GlobalMerchantRuleCategorizer(),
      new AICategorizer()
    ];
  }

  /**
   * Registers a new custom categorizer strategy.
   * @param {Object} categorizer - Must implement categorize(userId, note, allowedCategories)
   */
  register(categorizer) {
    this.categorizers.push(categorizer);
  }

  /**
   * Categorizes a transaction note.
   * Runs the pipeline sequentially. First match wins.
   * @param {number} userId - The user ID context
   * @param {string} note - The transaction note
   * @returns {Promise<Object>} The structured category result
   */
  async categorize(userId, note) {
    if (!note || note.trim().length === 0) {
      return {
        category: 'Other',
        confidence: 'low',
        strategy: 'fallback',
        reason: 'Empty description'
      };
    }

    for (const categorizer of this.categorizers) {
      try {
        const result = await categorizer.categorize(userId, note, GLOBAL_CATEGORIES);
        if (result) {
          return result;
        }
      } catch (err) {
        console.error(`[categorization-engine]: Strategy '${categorizer.name}' failed:`, err.message);
      }
    }

    // Default fallback
    return {
      category: 'Other',
      confidence: 'low',
      strategy: 'fallback',
      reason: 'No match in any categorization strategy'
    };
  }
}

export const categorizationEngine = new CategorizationEngine();
export default categorizationEngine;
