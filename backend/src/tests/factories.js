/**
 * Reusable test data factories/helpers for unit and integration tests.
 * These helpers generate deterministic mock data with standard fields 
 * while allowing easy value overrides for testing specific behaviors.
 */

export const userFactory = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 10000) + 1;
  return {
    id,
    name: overrides.name ?? `Test User ${id}`,
    email: overrides.email ?? `user-${id}@example.com`,
    password: overrides.password ?? 'password123',
    phone: overrides.phone ?? '+1234567890',
    bio: overrides.bio ?? 'Test bio description',
    profilePhoto: overrides.profilePhoto ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides
  };
};

export const transactionFactory = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 10000) + 1;
  return {
    id,
    amount: overrides.amount ?? 150.00,
    type: overrides.type ?? 'expense',
    category: overrides.category ?? 'Food & Dining',
    note: overrides.note ?? 'Lunch',
    date: overrides.date ?? '2026-08-24',
    isAnomaly: overrides.isAnomaly ?? false,
    anomalyReason: overrides.anomalyReason ?? null,
    userId: overrides.userId ?? 1,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides
  };
};

export const budgetFactory = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 10000) + 1;
  return {
    id,
    category: overrides.category ?? 'Food & Dining',
    limit: overrides.limit ?? 5000.00,
    userId: overrides.userId ?? 1,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides
  };
};

export const goalFactory = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 10000) + 1;
  return {
    id,
    title: overrides.title ?? 'Emergency Fund',
    targetAmount: overrides.targetAmount ?? 50000.00,
    currentAmount: overrides.currentAmount ?? 10000.00,
    deadline: overrides.deadline ?? '2027-01-01',
    userId: overrides.userId ?? 1,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides
  };
};

export const subscriptionFactory = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 10000) + 1;
  return {
    id,
    name: overrides.name ?? 'Netflix Subscription',
    amount: overrides.amount ?? 649.00,
    type: overrides.type ?? 'expense',
    category: overrides.category ?? 'Entertainment',
    frequency: overrides.frequency ?? 'monthly',
    startDate: overrides.startDate ?? '2026-01-01',
    endDate: overrides.endDate ?? null,
    nextOccurrence: overrides.nextOccurrence ?? '2026-09-01',
    lastProcessedDate: overrides.lastProcessedDate ?? '2026-08-01',
    isActive: overrides.isActive ?? true,
    notes: overrides.notes ?? 'Standard plan',
    isSubscription: overrides.isSubscription ?? true,
    provider: overrides.provider ?? 'Netflix',
    cancellationDate: overrides.cancellationDate ?? null,
    userId: overrides.userId ?? 1,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides
  };
};

export const notificationFactory = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 10000) + 1;
  return {
    id,
    title: overrides.title ?? 'Budget Exceeded',
    message: overrides.message ?? 'You have exceeded your Entertainment budget.',
    type: overrides.type ?? 'budget_exceeded',
    refId: overrides.refId ?? 'budget-ent-100',
    isRead: overrides.isRead ?? false,
    userId: overrides.userId ?? 1,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    ...overrides
  };
};
