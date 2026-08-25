import NotificationProvider from './NotificationProvider.js';

export class EmailProvider extends NotificationProvider {
  constructor() {
    super('email');
  }

  async send({ userId, type, title, message, refId }) {
    // In a real application, fetch user email from DB and send via Resend, SendGrid, etc.
    // For MoneyMind extensibility, we print mock logs to output.
    console.log(`[EmailProvider] Simulated mail delivery to User #${userId}`);
    console.log(`  Subject: ${title}`);
    console.log(`  Body: ${message}`);
    return true;
  }
}

export default EmailProvider;
