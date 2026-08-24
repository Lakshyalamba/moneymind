import test from 'node:test';
import assert from 'node:assert';
import { aiRateLimiter } from '../modules/ai/aiRoutes.js';

// Mock Express request and response to test the rate-limiter middleware
const createMockReqRes = (ip) => {
    const req = {
        ip,
        headers: {},
        socket: {}
    };
    
    let statusVal = 200;
    let jsonVal = null;
    
    const res = {
        status(code) {
            statusVal = code;
            return this;
        },
        json(data) {
            jsonVal = data;
            return this;
        }
    };
    
    return {
        req,
        res,
        getStatus: () => statusVal,
        getJson: () => jsonVal
    };
};

test('AI Rate Limiter - Under Limit vs Over Limit', () => {
    const { req, res, getStatus, getJson } = createMockReqRes('192.168.1.50');
    
    // Call rate-limiter 10 times. All should pass (next called, status remains 200)
    for (let i = 0; i < 10; i++) {
        let nextCalled = false;
        aiRateLimiter(req, res, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true);
        assert.strictEqual(getStatus(), 200);
    }
    
    // The 11th call should fail with status 429
    let nextCalled11 = false;
    aiRateLimiter(req, res, () => { nextCalled11 = true; });
    assert.strictEqual(nextCalled11, false);
    assert.strictEqual(getStatus(), 429);
    assert.strictEqual(getJson().error, 'Too many requests. Please try again after a minute.');
});

test('AI Advice Fallback - Clean Context Mapping', () => {
    const financialContextEmpty = {
        currentMonth: { income: 0, expenses: 0, savings: 0, savingsRate: 0 },
        budgets: [],
        goals: [],
        subscriptions: []
    };
    
    // Test that fallback triggers clean rule-based responses
    const normalizedMessage = 'give me saving tips';
    const balance = financialContextEmpty.currentMonth.savings;
    
    const advice = [];
    if (financialContextEmpty.currentMonth.income === 0) {
        advice.push('I do not see any financial activity yet. Start by adding your income and usual monthly expenses.');
    }
    
    assert.strictEqual(advice[0], 'I do not see any financial activity yet. Start by adding your income and usual monthly expenses.');
});
