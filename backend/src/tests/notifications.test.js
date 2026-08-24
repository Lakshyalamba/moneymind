import test from 'node:test';
import assert from 'node:assert';

// Mock notification processing rules for tests
const evaluateBudgetAlert = (spent, limit) => {
  const percentageUsed = (spent / limit) * 100;
  
  let threshold = 0;
  let type = '';
  
  if (percentageUsed >= 100) {
    threshold = 100;
    type = 'budget_exceeded';
  } else if (percentageUsed >= 90) {
    threshold = 90;
    type = 'budget_warning';
  } else if (percentageUsed >= 75) {
    threshold = 75;
    type = 'budget_warning';
  } else if (percentageUsed >= 50) {
    threshold = 50;
    type = 'budget_warning';
  }
  
  if (threshold > 0) {
    return {
      type,
      refId: `budget-1-${threshold}`,
      title: `Threshold ${threshold}% Crossed`
    };
  }
  
  return null;
};

test('Budget Warning Thresholds - Correct evaluation', () => {
  // 45% - No alert
  assert.strictEqual(evaluateBudgetAlert(450, 1000), null);

  // 60% - Info alert
  const alert50 = evaluateBudgetAlert(600, 1000);
  assert.notStrictEqual(alert50, null);
  assert.strictEqual(alert50.type, 'budget_warning');
  assert.strictEqual(alert50.refId, 'budget-1-50');

  // 80% - Warning alert
  const alert75 = evaluateBudgetAlert(800, 1000);
  assert.strictEqual(alert75.refId, 'budget-1-75');

  // 110% - Exceeded alert
  const alert100 = evaluateBudgetAlert(1100, 1000);
  assert.strictEqual(alert100.type, 'budget_exceeded');
  assert.strictEqual(alert100.refId, 'budget-1-100');
});

test('Deduplication Prevention Logic', () => {
  const notificationsDb = []; // simulated DB
  
  const triggerNotification = (alert, userId) => {
    // Check if refId unique constraint is violated
    const exists = notificationsDb.some(n => n.userId === userId && n.refId === alert.refId);
    if (!exists) {
      notificationsDb.push({
        id: notificationsDb.length + 1,
        userId,
        refId: alert.refId,
        isRead: false
      });
      return true;
    }
    return false; // Ignored duplicate!
  };

  const alert1 = { refId: 'budget-1-75' };
  const firstTrigger = triggerNotification(alert1, 1);
  assert.strictEqual(firstTrigger, true);
  assert.strictEqual(notificationsDb.length, 1);

  // Triggering the same threshold alert again should be blocked
  const secondTrigger = triggerNotification(alert1, 1);
  assert.strictEqual(secondTrigger, false);
  assert.strictEqual(notificationsDb.length, 1); // Length stayed 1
});
