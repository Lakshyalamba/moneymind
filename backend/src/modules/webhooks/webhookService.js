import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Signs a webhook payload using HMAC-SHA256.
 * @param {Object} payload - Webhook payload object
 * @param {string} secret - Subscription secret key
 * @returns {string} The hex signature
 */
export const signPayload = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

/**
 * Triggers a POST call to a webhook endpoint with retry mechanism.
 */
const deliverWebhook = async (url, payload, secret, attempt = 1) => {
  const signature = signPayload(payload, secret);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MoneyMind-Signature': signature,
        'X-MoneyMind-Event-Id': payload.eventId,
        'X-MoneyMind-Attempt': String(attempt)
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[webhook-delivery]: Succeeded for event '${payload.eventType}' to ${url} on attempt ${attempt}`);
      return true;
    }

    throw new Error(`Endpoint returned status ${response.status}`);
  } catch (err) {
    console.error(`[webhook-delivery]: Attempt ${attempt} failed to ${url}:`, err.message);
    
    if (attempt < 3) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
      setTimeout(() => {
        deliverWebhook(url, payload, secret, attempt + 1);
      }, delay);
    }
    return false;
  }
};

/**
 * Dispatches an event to all registered and active webhook subscriptions for a user.
 * @param {number} userId - The user ID context
 * @param {string} eventType - transaction.created, budget.exceeded, etc.
 * @param {Object} data - The event-specific details
 */
export const dispatchEvent = async (userId, eventType, data) => {
  try {
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    if (subscriptions.length === 0) return;

    // Filter subscriptions matching the event type or subscribed to all events '*'
    const matchedSubscriptions = subscriptions.filter(sub => 
      sub.events.includes(eventType) || sub.events.includes('*')
    );

    const payload = {
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType,
      payloadVersion: '1.0',
      data
    };

    // Fire-and-forget delivery trigger for each matching subscription
    matchedSubscriptions.forEach(sub => {
      deliverWebhook(sub.url, payload, sub.secret);
    });

  } catch (err) {
    console.error('[webhook-service]: Failed to dispatch event:', err.message);
  }
};

// CRUD Operations for Webhook Subscriptions
export const listSubscriptions = async (userId) => {
  return prisma.webhookSubscription.findMany({ where: { userId } });
};

export const createSubscription = async (userId, { url, events, secret }) => {
  const webhookSecret = secret || crypto.randomBytes(32).toString('hex');
  return prisma.webhookSubscription.create({
    data: {
      userId,
      url,
      events,
      secret: webhookSecret,
      isActive: true
    }
  });
};

export const updateSubscription = async (id, userId, { url, events, isActive }) => {
  const existing = await prisma.webhookSubscription.findFirst({
    where: { id: parseInt(id), userId }
  });

  if (!existing) {
    return null;
  }

  return prisma.webhookSubscription.update({
    where: { id: existing.id },
    data: {
      ...(url && { url }),
      ...(events && { events }),
      ...(isActive !== undefined && { isActive })
    }
  });
};

export const deleteSubscription = async (id, userId) => {
  const existing = await prisma.webhookSubscription.findFirst({
    where: { id: parseInt(id), userId }
  });

  if (!existing) {
    return null;
  }

  return prisma.webhookSubscription.delete({
    where: { id: existing.id }
  });
};
