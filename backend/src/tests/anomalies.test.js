import test from 'node:test';
import assert from 'node:assert';

// Mock implementation of categorization layers for unit test verification
const GLOBAL_CATEGORIES = ['Food & Dining', 'Salary', 'Housing', 'Utilities', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];
const GLOBAL_MERCHANT_MAP = [
  { pattern: 'swiggy', category: 'Food & Dining' },
  { pattern: 'zomato', category: 'Food & Dining' },
  { pattern: 'uber', category: 'Transportation' }
];

const mockCategorizeTransaction = (note, customRules = []) => {
  if (!note || note.trim().length === 0) return 'Other';
  const keyword = note.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  // Layer 1: custom learned user rule
  const matchedRule = customRules.find(r => r.pattern === keyword);
  if (matchedRule) return matchedRule.category;

  // Layer 2: global mapping
  const cleanNote = note.toLowerCase();
  const matchedGlobal = GLOBAL_MERCHANT_MAP.find(m => cleanNote.includes(m.pattern));
  if (matchedGlobal) return matchedGlobal.category;

  // Layer 4: Fallback
  return 'Other';
};

// Mock spending anomaly detection
const mockDetectAnomaly = (amount, history = []) => {
  if (history.length < 3) {
    return { isAnomaly: false, anomalyReason: null };
  }

  const n = history.length;
  const mean = history.reduce((sum, val) => sum + val, 0) / n;
  const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const z = stdDev > 0 ? (amount - mean) / stdDev : 0;
  const threshold = 2.5;

  if (z >= threshold) {
    const multiplier = (amount / mean).toFixed(1);
    return {
      isAnomaly: true,
      anomalyReason: `Unusual spending compared with your historical spending. This transaction is approximately ${multiplier}x your usual spending for this category.`
    };
  }

  return { isAnomaly: false, anomalyReason: null };
};

test('Layered Categorization - Custom rule vs Global map vs Fallback', () => {
  // Global map match
  assert.strictEqual(mockCategorizeTransaction('Swiggy Order #401'), 'Food & Dining');
  assert.strictEqual(mockCategorizeTransaction('Uber Ride in Bangalore'), 'Transportation');

  // Fallback to Other
  assert.strictEqual(mockCategorizeTransaction('Generic shop payment'), 'Other');

  // Custom user rule match (Layer 1 takes precedence)
  const rules = [{ pattern: 'uber', category: 'Shopping' }]; // User decided Uber is shopping
  assert.strictEqual(mockCategorizeTransaction('Uber Ride', rules), 'Shopping');
});

test('Anomaly Detection - Insufficient data baseline', () => {
  const history = [100, 120]; // Less than 3 transactions
  const result = mockDetectAnomaly(1000, history);
  assert.strictEqual(result.isAnomaly, false);
  assert.strictEqual(result.anomalyReason, null);
});

test('Anomaly Detection - Z-Score Anomaly Trigger', () => {
  const history = [100, 105, 110, 95, 100]; // Mean = 102, StdDev = ~5.1
  
  // A normal value
  const normalResult = mockDetectAnomaly(105, history);
  assert.strictEqual(normalResult.isAnomaly, false);

  // A Z-score anomaly value (amount = 500 -> Z-score > 70!)
  const anomalyResult = mockDetectAnomaly(500, history);
  assert.strictEqual(anomalyResult.isAnomaly, true);
  assert.match(anomalyResult.anomalyReason, /Unusual spending/);
});
