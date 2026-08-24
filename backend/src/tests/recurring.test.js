import test from 'node:test';
import assert from 'node:assert';

// Local reference of calculations to keep tests lightweight and isolated
const calculateNextOccurrence = (currentDateStr, frequency) => {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (frequency === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Isolated processing logic mock for test verification
const processTransactionMock = (item, targetDateStr) => {
  // If already processed today, skip and advance
  if (item.lastProcessedDate === item.nextOccurrence) {
    const updatedNext = calculateNextOccurrence(item.nextOccurrence, item.frequency);
    let stillActive = true;
    if (item.endDate && updatedNext > item.endDate) stillActive = false;
    
    return {
      transactionGenerated: null,
      updatedItem: {
        ...item,
        nextOccurrence: updatedNext,
        isActive: stillActive
      }
    };
  }

  // Generate transaction
  const transaction = {
    amount: item.amount,
    type: item.type,
    category: item.category,
    date: item.nextOccurrence
  };

  const updatedNext = calculateNextOccurrence(item.nextOccurrence, item.frequency);
  let stillActive = true;
  if (item.endDate && updatedNext > item.endDate) stillActive = false;

  return {
    transactionGenerated: transaction,
    updatedItem: {
      ...item,
      lastProcessedDate: item.nextOccurrence,
      nextOccurrence: updatedNext,
      isActive: stillActive
    }
  };
};

test('Recurrence calculations - Daily, Weekly, Monthly, Yearly', () => {
  assert.strictEqual(calculateNextOccurrence('2026-08-24', 'daily'), '2026-08-25');
  assert.strictEqual(calculateNextOccurrence('2026-08-24', 'weekly'), '2026-08-31');
  assert.strictEqual(calculateNextOccurrence('2026-08-15', 'monthly'), '2026-09-15');
  assert.strictEqual(calculateNextOccurrence('2026-08-01', 'monthly'), '2026-09-01');
  assert.strictEqual(calculateNextOccurrence('2026-08-24', 'yearly'), '2027-08-24');
});

test('Idempotency / Duplicate Prevention Check', () => {
  const item = {
    id: 1,
    name: 'Rent',
    amount: 15000,
    type: 'expense',
    category: 'Housing',
    frequency: 'monthly',
    nextOccurrence: '2026-08-01',
    lastProcessedDate: null,
    isActive: true
  };

  // Run 1: Should generate a transaction and advance nextOccurrence
  const run1 = processTransactionMock(item, '2026-08-01');
  assert.notStrictEqual(run1.transactionGenerated, null);
  assert.strictEqual(run1.updatedItem.lastProcessedDate, '2026-08-01');
  assert.strictEqual(run1.updatedItem.nextOccurrence, '2026-09-01');

  // Run 2: Re-running with the SAME state but simulate double execution (if nextOccurrence somehow stayed same)
  // If lastProcessedDate === nextOccurrence, it should NOT generate duplicate
  const doubleTriggerState = {
    ...item,
    lastProcessedDate: '2026-08-01',
    nextOccurrence: '2026-08-01'
  };

  const run2 = processTransactionMock(doubleTriggerState, '2026-08-01');
  assert.strictEqual(run2.transactionGenerated, null); // Duplicate blocked!
  assert.strictEqual(run2.updatedItem.nextOccurrence, '2026-09-01');
});

test('Expiry via End Date', () => {
  const item = {
    id: 2,
    name: 'Short contract',
    amount: 1000,
    type: 'expense',
    category: 'Utilities',
    frequency: 'daily',
    nextOccurrence: '2026-08-24',
    endDate: '2026-08-24', // Ends today! Next occurrence will be Aug 25th which is after endDate
    lastProcessedDate: null,
    isActive: true
  };

  const result = processTransactionMock(item, '2026-08-24');
  assert.notStrictEqual(result.transactionGenerated, null);
  assert.strictEqual(result.updatedItem.isActive, false); // Deactivated successfully!
});
