import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

import { aiProviderFactory } from '../modules/ai/providers/ProviderFactory.js';
import { FallbackAIProvider } from '../modules/ai/providers/FallbackAIProvider.js';
import { GeminiProvider } from '../modules/ai/providers/GeminiProvider.js';

import { UserDefinedCategorizer } from '../modules/transactions/categorization/UserDefinedCategorizer.js';
import { GlobalMerchantRuleCategorizer } from '../modules/transactions/categorization/GlobalMerchantRuleCategorizer.js';
import { CategorizationEngine, GLOBAL_CATEGORIES } from '../modules/transactions/categorization/CategorizationEngine.js';

import { CSVImporter } from '../modules/transactions/adapters/CSVImporter.js';
import { JSONImporter } from '../modules/transactions/adapters/JSONImporter.js';
import { CSVExporter } from '../modules/transactions/adapters/CSVExporter.js';
import { JSONExporter } from '../modules/transactions/adapters/JSONExporter.js';

// ==============================================================================
// 1. AI PROVIDER ABSTRACTION TESTS
// ==============================================================================

test('AI Provider Factory - Returns Fallback Provider when config empty', () => {
  const originalEnv = process.env.AI_PROVIDER;
  const originalKey = process.env.GEMINI_API_KEY;
  
  process.env.AI_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = ''; // empty key

  const provider = aiProviderFactory.getProvider();
  assert.ok(provider instanceof FallbackAIProvider);

  // Restore env
  process.env.AI_PROVIDER = originalEnv;
  process.env.GEMINI_API_KEY = originalKey;
});

test('Gemini Provider - Throws error when initialized with empty API key', () => {
  assert.throws(() => {
    new GeminiProvider('');
  }, /Gemini API key is required/);
});

// ==============================================================================
// 2. TRANSACTION CATEGORIZATION ENGINE TESTS
// ==============================================================================

test('UserDefinedCategorizer - Matches database rule when present', async () => {
  const mockDb = {
    categoryRule: {
      findUnique: async () => ({
        userId: 1,
        pattern: 'uber',
        category: 'Transportation'
      })
    }
  };

  const categorizer = new UserDefinedCategorizer(mockDb);
  const result = await categorizer.categorize(1, 'Uber Ride', GLOBAL_CATEGORIES);

  assert.notStrictEqual(result, null);
  assert.strictEqual(result.category, 'Transportation');
  assert.strictEqual(result.strategy, 'user-rule');
  assert.strictEqual(result.confidence, 'high');
});

test('GlobalMerchantRuleCategorizer - Matches global config mappings', async () => {
  const categorizer = new GlobalMerchantRuleCategorizer();
  // Inject mock rule to ensure test is fully isolated from external files
  categorizer.rules = [
    { pattern: 'netflix', category: 'Entertainment' },
    { pattern: 'uber', category: 'Transportation' }
  ];

  const result = await categorizer.categorize(1, 'Netflix monthly sub', GLOBAL_CATEGORIES);
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.category, 'Entertainment');
  assert.strictEqual(result.strategy, 'merchant-rule');
  assert.strictEqual(result.confidence, 'high');
});

test('CategorizationEngine - Default fallback when no strategies match', async () => {
  const engine = new CategorizationEngine();
  const mockDb = {
    categoryRule: {
      findUnique: async () => null
    }
  };
  // Inject mock DB client into UserDefinedCategorizer
  engine.categorizers[0] = new UserDefinedCategorizer(mockDb);
  // Clear global merchant rules
  engine.categorizers[1].rules = [];

  const result = await engine.categorize(1, 'Unknown non-matching string');
  assert.strictEqual(result.category, 'Other');
  assert.strictEqual(result.strategy, 'fallback');
  assert.strictEqual(result.confidence, 'low');
});

// ==============================================================================
// 3. IMPORT / EXPORT ADAPTER TESTS
// ==============================================================================

test('CSVImporter - Parses valid CSV correctly', () => {
  const csv = `amount,type,category,date,note
150.50,expense,Food & Dining,2026-08-24,Lunch at restaurant
5000,income,Salary,2026-08-01,Monthly salary`;

  const importer = new CSVImporter();
  const parsed = importer.parse(csv);

  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[0].amount, 150.50);
  assert.strictEqual(parsed[0].type, 'expense');
  assert.strictEqual(parsed[0].category, 'Food & Dining');
  assert.strictEqual(parsed[0].date, '2026-08-24');
  assert.strictEqual(parsed[0].note, 'Lunch at restaurant');
});

test('CSVImporter - Throws error for missing columns', () => {
  const malformedCsv = `amount,type,date
150.50,expense,2026-08-24`;

  const importer = new CSVImporter();
  assert.throws(() => {
    importer.parse(malformedCsv);
  }, /CSV is missing required column: category/);
});

test('CSVImporter - Throws error for malformed date/amounts', () => {
  const csvBadDate = `amount,type,category,date,note
150,expense,Food,2026/08/24,Lunch`;

  const importer = new CSVImporter();
  assert.throws(() => {
    importer.parse(csvBadDate);
  }, /invalid date format/);
});

test('JSONImporter - Parses valid JSON list correctly', () => {
  const json = `[
    { "amount": 100, "type": "expense", "category": "Shopping", "date": "2026-08-24", "note": "Shirts" },
    { "amount": 250, "type": "income", "category": "Freelance", "date": "2026-08-20" }
  ]`;

  const importer = new JSONImporter();
  const parsed = importer.parse(json);

  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[0].amount, 100);
  assert.strictEqual(parsed[0].type, 'expense');
  assert.strictEqual(parsed[0].category, 'Shopping');
  assert.strictEqual(parsed[0].date, '2026-08-24');
  assert.strictEqual(parsed[0].note, 'Shirts');
  assert.strictEqual(parsed[1].note, '');
});

test('CSVExporter - Formats transaction rows correctly', () => {
  const transactions = [
    { amount: 150.00, type: 'expense', category: 'Food, Dining', date: '2026-08-24', note: 'Burger' }
  ];

  const exporter = new CSVExporter();
  const csvString = exporter.export(transactions);

  assert.ok(csvString.includes('date,amount,type,category,note'));
  // Category should be quoted because it contains a comma
  assert.ok(csvString.includes('"Food, Dining"'));
  assert.ok(csvString.includes('2026-08-24,150,expense'));
});

test('JSONExporter - Formats normalized JSON list correctly', () => {
  const transactions = [
    { amount: 150.00, type: 'expense', category: 'Food', date: '2026-08-24', note: 'Burger', unusedField: 'ignored' }
  ];

  const exporter = new JSONExporter();
  const jsonString = exporter.export(transactions);
  const parsed = JSON.parse(jsonString);

  assert.strictEqual(parsed.length, 1);
  assert.strictEqual(parsed[0].unusedField, undefined); // should be stripped/normalized
  assert.strictEqual(parsed[0].amount, 150);
  assert.strictEqual(parsed[0].type, 'expense');
});
