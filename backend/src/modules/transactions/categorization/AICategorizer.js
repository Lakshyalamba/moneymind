import aiProviderFactory from '../../ai/providers/ProviderFactory.js';
import FallbackAIProvider from '../../ai/providers/FallbackAIProvider.js';

export class AICategorizer {
  constructor() {
    this.name = 'ai-classifier';
  }

  async categorize(userId, note, allowedCategories) {
    const provider = aiProviderFactory.getProvider();
    
    // If the provider is a FallbackAIProvider, don't perform slow AI classification.
    // Return the fallback or let it skip.
    if (provider instanceof FallbackAIProvider) {
      return null;
    }

    try {
      const category = await provider.categorizeTransaction(note, allowedCategories);
      if (category && allowedCategories.includes(category)) {
        return {
          category,
          confidence: 'medium',
          strategy: this.name,
          reason: 'Categorized using active AI classification'
        };
      }
    } catch (err) {
      console.error('[ai-categorizer]: AI categorization failed:', err.message);
    }

    return null;
  }
}
export default AICategorizer;
