import GeminiProvider from './GeminiProvider.js';
import FallbackAIProvider from './FallbackAIProvider.js';

export class ProviderFactory {
  constructor() {
    this.providers = new Map();
    this.register('fallback', (key) => new FallbackAIProvider());
    this.register('gemini', (key) => new GeminiProvider(key));
  }

  /**
   * Registers a new AI Provider constructor/builder.
   * @param {string} name - The unique name for the provider (e.g. 'openai')
   * @param {Function} builder - A function taking (apiKey) and returning an AIProvider instance.
   */
  register(name, builder) {
    this.providers.set(name.toLowerCase(), builder);
  }

  /**
   * Retrieves the configured AI Provider.
   * Resolves environment variables to determine which provider to select.
   * @returns {AIProvider} An initialized AI Provider instance.
   */
  getProvider() {
    const selected = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    
    // Determine appropriate API Key
    let apiKey = '';
    if (selected === 'gemini') {
      apiKey = process.env.GEMINI_API_KEY;
    } else if (selected === 'openai') {
      apiKey = process.env.OPENAI_API_KEY;
    } else {
      apiKey = process.env.AI_API_KEY;
    }

    const builder = this.providers.get(selected);

    if (!builder || !apiKey?.trim()) {
      console.warn(`[ai-factory]: Configured provider '${selected}' is missing an API key or unregistered. Falling back to local/rule-based advisor.`);
      return new FallbackAIProvider();
    }

    try {
      return builder(apiKey);
    } catch (err) {
      console.error(`[ai-factory]: Failed to initialize provider '${selected}':`, err.message);
      return new FallbackAIProvider();
    }
  }
}

// Singleton instance
export const aiProviderFactory = new ProviderFactory();
export default aiProviderFactory;
