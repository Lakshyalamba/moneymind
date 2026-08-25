import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import * as transactionsService from '../modules/transactions/transactionsService.js';
import * as budgetsService from '../modules/budgets/budgetsService.js';
import * as goalsService from '../modules/goals/goalsService.js';
import * as subscriptionsService from '../modules/subscriptions/subscriptionsService.js';
import * as webhookService from '../modules/webhooks/webhookService.js';

const prisma = new PrismaClient();

test('Security & IDOR - User A cannot access User B resources', async () => {
  // Clean up old test data by emails
  await prisma.webhookSubscription.deleteMany({ where: { user: { email: { in: ['usera@example.com', 'userb@example.com'] } } } });
  await prisma.transaction.deleteMany({ where: { user: { email: { in: ['usera@example.com', 'userb@example.com'] } } } });
  await prisma.budget.deleteMany({ where: { user: { email: { in: ['usera@example.com', 'userb@example.com'] } } } });
  await prisma.goal.deleteMany({ where: { user: { email: { in: ['usera@example.com', 'userb@example.com'] } } } });
  await prisma.recurringTransaction.deleteMany({ where: { user: { email: { in: ['usera@example.com', 'userb@example.com'] } } } });
  await prisma.notification.deleteMany({ where: { user: { email: { in: ['usera@example.com', 'userb@example.com'] } } } });
  await prisma.user.deleteMany({ where: { email: { in: ['usera@example.com', 'userb@example.com'] } } });

  // Create Users A & B
  const userA = await prisma.user.create({ data: { name: 'User A', email: 'usera@example.com' } });
  const userB = await prisma.user.create({ data: { name: 'User B', email: 'userb@example.com' } });

  const userAId = userA.id;
  const userBId = userB.id;

  // 1. Transaction IDOR check
  const txB = await prisma.transaction.create({
    data: {
      userId: userBId,
      amount: '50.00',
      type: 'expense',
      category: 'Shopping',
      date: '2026-08-25',
      note: 'User B private transaction'
    }
  });

  // User A tries to view User B's transaction
  const foundTx = await transactionsService.findTransactionById(txB.id, userAId);
  assert.equal(foundTx, null, 'User A must not be able to view User B transaction');

  // User A tries to delete User B's transaction
  const deletedTx = await transactionsService.deleteTransaction(txB.id, userAId);
  assert.equal(deletedTx, null, 'User A must not be able to delete User B transaction');

  // 2. Budget IDOR check
  const budgetB = await prisma.budget.create({
    data: {
      userId: userBId,
      category: 'Food & Dining',
      limit: '500.00'
    }
  });

  // User A tries to delete User B's budget
  const deletedBudget = await budgetsService.deleteBudget(budgetB.id, userAId);
  assert.equal(deletedBudget, null, 'User A must not be able to delete User B budget');

  // 3. Goal IDOR check
  const goalB = await prisma.goal.create({
    data: {
      userId: userBId,
      title: 'User B House goal',
      targetAmount: '100000.00',
      deadline: '2027-12-01'
    }
  });

  // User A tries to update User B's goal
  const updatedGoal = await goalsService.updateGoal(goalB.id, userAId, { title: 'Hacked Goal' });
  assert.equal(updatedGoal, null, 'User A must not be able to update User B goal');

  // User A tries to delete User B's goal
  const deletedGoal = await goalsService.deleteGoal(goalB.id, userAId);
  assert.equal(deletedGoal, null, 'User A must not be able to delete User B goal');

  // 4. Recurring bill IDOR check
  const recB = await prisma.recurringTransaction.create({
    data: {
      userId: userBId,
      name: 'User B Spotify',
      amount: '10.00',
      type: 'expense',
      category: 'Entertainment',
      frequency: 'monthly',
      startDate: '2026-08-25',
      nextOccurrence: '2026-09-25'
    }
  });

  // User A tries to update User B's subscription
  const updatedRec = await subscriptionsService.updateRecurring(recB.id, userAId, { name: 'Hacked Sub' });
  assert.equal(updatedRec, null, 'User A must not be able to update User B recurring transaction');

  // User A tries to delete User B's subscription
  const deletedRec = await subscriptionsService.deleteRecurring(recB.id, userAId);
  assert.equal(deletedRec, null, 'User A must not be able to delete User B recurring transaction');

  // 5. Webhook IDOR check
  const hookB = await prisma.webhookSubscription.create({
    data: {
      userId: userBId,
      url: 'https://userb.com/webhook',
      events: ['transaction.created'],
      secret: 'userbsecret'
    }
  });

  // User A tries to update User B's webhook subscription
  const updatedHook = await webhookService.updateSubscription(hookB.id, userAId, { url: 'https://hacker.com' });
  assert.equal(updatedHook, null, 'User A must not be able to update User B webhook subscription');

  // User A tries to delete User B's webhook subscription
  const deletedHook = await webhookService.deleteSubscription(hookB.id, userAId);
  assert.equal(deletedHook, null, 'User A must not be able to delete User B webhook subscription');

  // Clean up
  await prisma.webhookSubscription.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
  await prisma.transaction.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
  await prisma.budget.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
  await prisma.goal.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
  await prisma.recurringTransaction.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
});
