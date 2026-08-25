import { PrismaClient } from '@prisma/client';
import NotificationProvider from './NotificationProvider.js';
import { dispatchEvent } from '../../webhooks/webhookService.js';

const prisma = new PrismaClient();

export class InAppProvider extends NotificationProvider {
  constructor() {
    super('in-app');
  }

  async send({ userId, type, title, message, refId }) {
    try {
      // Check if duplicate refId already exists to prevent duplicates
      if (refId) {
        const existing = await prisma.notification.findUnique({
          where: {
            userId_refId: {
              userId,
              refId
            }
          }
        });
        if (existing) {
          // Already created, return silently
          return true;
        }
      }

      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          refId,
          isRead: false
        }
      });

      // Dispatch Webhooks on specific new notifications
      if (type === 'budget_exceeded') {
        await dispatchEvent(userId, 'budget.exceeded', { title, message });
      } else if (type === 'goal_milestone' && refId && refId.endsWith('-100')) {
        await dispatchEvent(userId, 'goal.completed', { title, message });
      } else if (type === 'upcoming_subscription') {
        await dispatchEvent(userId, 'subscription.upcoming', { title, message });
      }

      return true;
    } catch (err) {
      console.error('[InAppProvider] Failed to create in-app notification:', err.message);
      return false;
    }
  }
}

export default InAppProvider;
