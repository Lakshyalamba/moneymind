/**
 * Abstract Base Class for AI Providers.
 * Any new AI integration (e.g., OpenAI, Anthropic, Groq, Ollama) must extend 
 * this class and implement all its methods.
 */
export class AIProvider {
  /**
   * Generates a conversational advice response based on a prompt and system instruction.
   * @param {string} prompt
   * @param {string} systemInstruction
   * @returns {Promise<string>} The generated response text.
   */
  async generateResponse(prompt, systemInstruction) {
    throw new Error('Method generateResponse() must be implemented.');
  }

  /**
   * Categorizes a transaction description into one of the allowed categories.
   * @param {string} note - The transaction note/description.
   * @param {string[]} categories - The list of allowed categories.
   * @returns {Promise<string>} The exact category name returned by the model.
   */
  async categorizeTransaction(note, categories) {
    throw new Error('Method categorizeTransaction() must be implemented.');
  }

  /**
   * Analyzes an array of transactions and returns category recommendations or advice.
   * @param {Array} transactions - Sanitized transactions array.
   * @returns {Promise<string>} Insights text.
   */
  async analyzeSpending(transactions) {
    throw new Error('Method analyzeSpending() must be implemented.');
  }

  /**
   * Generates formatted financial health insights based on dynamic context data.
   * @param {Object} financialContext - Aggregated financial metrics.
   * @returns {Promise<string>} Formatted summary and recommendations.
   */
  async generateInsights(financialContext) {
    throw new Error('Method generateInsights() must be implemented.');
  }
}
export default AIProvider;
