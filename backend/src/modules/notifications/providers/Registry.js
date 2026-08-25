import InAppProvider from './InAppProvider.js';
import EmailProvider from './EmailProvider.js';

export class NotificationRegistry {
  constructor() {
    this.providers = [];
    this.register(new InAppProvider());
    this.register(new EmailProvider());
  }

  /**
   * Registers a new custom notification delivery provider.
   * @param {NotificationProvider} provider
   */
  register(provider) {
    this.providers.push(provider);
  }

  /**
   * Dispatches a notification parameter payload to all registered providers.
   * Ensures that if one provider crashes, others still attempt delivery.
   * @param {Object} params - Delivery arguments
   * @returns {Promise<boolean>} True if at least one delivery succeeded
   */
  async dispatch(params) {
    const results = await Promise.all(
      this.providers.map(provider => 
        provider.send(params).catch(err => {
          console.error(`[notification-registry]: Provider '${provider.name}' failed delivery:`, err.message);
          return false;
        })
      )
    );
    return results.some(Boolean);
  }
}

export const notificationRegistry = new NotificationRegistry();
export default notificationRegistry;
