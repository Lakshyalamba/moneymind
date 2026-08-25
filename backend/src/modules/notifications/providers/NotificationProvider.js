/**
 * Base abstract class for Notification Delivery Providers.
 * External contributors can extend this class to add custom delivery backends
 * (e.g. Twilio SMS, Telegram bot, Slack webhook, etc.)
 */
export class NotificationProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Sends a notification to the destination.
   * @param {Object} notificationParams
   * @param {number} notificationParams.userId - User ID receiving the notification.
   * @param {string} notificationParams.type - Notification type.
   * @param {string} notificationParams.title - The subject title.
   * @param {string} notificationParams.message - The notification body.
   * @param {string} [notificationParams.refId] - Uniqueness deduplication ID.
   * @returns {Promise<boolean>} Resolves to true if delivery succeeded.
   */
  async send(notificationParams) {
    throw new Error(`NotificationProvider '${this.name}' must implement send() method.`);
  }
}

export default NotificationProvider;
