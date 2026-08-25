import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import {
  signPayload,
  createSubscription,
  listSubscriptions,
  updateSubscription,
  deleteSubscription
} from '../modules/webhooks/webhookService.js';

const prisma = new PrismaClient();

test('Webhook Pipeline - HMAC signing payload verification', () => {
  const secret = 'super-secret-key';
  const payload = { eventId: '123', eventType: 'test.event', data: { hello: 'world' } };

  const sig1 = signPayload(payload, secret);
  const sig2 = signPayload(payload, secret);

  assert.equal(sig1, sig2, 'HMAC signatures must be deterministic and identical');

  const sigDifferentSecret = signPayload(payload, 'other-secret');
  assert.notEqual(sig1, sigDifferentSecret, 'Different secrets must generate different signatures');
});

test('Webhook Pipeline - CRUD Operations', async () => {
  const testUserId = 99999;

  // Clean up any old test records first
  await prisma.webhookSubscription.deleteMany({ where: { userId: testUserId } });
  await prisma.user.deleteMany({ where: { id: testUserId } });

  // Create test user to prevent FK constraint violation
  await prisma.user.create({
    data: {
      id: testUserId,
      name: 'Webhook Test User',
      email: 'webhooktest@example.com'
    }
  });

  // Create subscription
  const sub = await createSubscription(testUserId, {
    url: 'https://example.com/webhook',
    events: ['transaction.created'],
    secret: 'test-secret'
  });

  assert.ok(sub.id, 'Subscription must be successfully created with a DB ID');
  assert.equal(sub.url, 'https://example.com/webhook');
  assert.equal(sub.secret, 'test-secret');

  // List
  const list = await listSubscriptions(testUserId);
  assert.equal(list.length, 1, 'Should return exactly 1 subscription');

  // Update
  const updated = await updateSubscription(sub.id, testUserId, {
    url: 'https://example.com/webhook-updated',
    isActive: false
  });
  assert.equal(updated.url, 'https://example.com/webhook-updated');
  assert.equal(updated.isActive, false);

  // Delete
  const deleted = await deleteSubscription(sub.id, testUserId);
  assert.ok(deleted, 'Delete operation should return the deleted record');

  const emptyList = await listSubscriptions(testUserId);
  assert.equal(emptyList.length, 0, 'List should be empty after deleting subscription');

  // Clean up test user
  await prisma.user.delete({ where: { id: testUserId } });
});
