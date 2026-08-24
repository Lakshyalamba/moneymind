import { GoogleGenerativeAI } from '@google/generative-ai';
import AIProvider from './AIProvider.js';

export class GeminiProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey?.trim();
    this.models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    
    if (!this.apiKey) {
      throw new Error('Gemini API key is required.');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async _executeWithTimeout(promise, timeoutMs = 5000) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('AI Request Timeout'));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateResponse(prompt, systemInstruction) {
    let lastError = null;

    for (const modelName of this.models) {
      try {
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction 
        });

        const apiCall = model.generateContent(prompt);
        const result = await this._executeWithTimeout(apiCall, 5000);
        const responseText = result.response.text()?.trim();

        if (responseText) {
          return responseText;
        }
        
        throw new Error('Empty response received from AI model');
      } catch (err) {
        lastError = err;
        console.error(`Gemini model ${modelName} failed:`, err.message);
        
        // If the API key is clearly invalid, abort immediately to avoid retrying other models
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('key is invalid')) {
          throw new Error('Invalid Gemini API Key');
        }
      }
    }

    throw new Error(lastError?.message || 'AI request failed');
  }

  async categorizeTransaction(note, categories) {
    const system = 'You are a precise classification engine that assigns transactions to category classes.';
    const prompt = `Classify this transaction description: "${note}" into exactly one of these categories:
${categories.map(c => `- ${c}`).join('\n')}

Return ONLY the exact category name as plain text. Do not include quotes, markdown bolding, periods, or other explanation.`;

    const resultText = await this.generateResponse(prompt, system);
    
    if (!categories.includes(resultText)) {
      throw new Error(`Malformed AI response: "${resultText}" is not an allowed category.`);
    }

    return resultText;
  }

  async analyzeSpending(transactions) {
    const system = 'You are a personal finance analyzer.';
    const prompt = `Analyze these recent transactions and provide a short spending summary (max 2 sentences):\n${JSON.stringify(transactions)}`;
    return this.generateResponse(prompt, system);
  }

  async generateInsights(financialContext) {
    const system = 'You are a strategic financial planner.';
    const prompt = `Analyze this user profile financial context and give three key actionable insights (max 3 sentences total):\n${JSON.stringify(financialContext)}`;
    return this.generateResponse(prompt, system);
  }
}
export default GeminiProvider;
