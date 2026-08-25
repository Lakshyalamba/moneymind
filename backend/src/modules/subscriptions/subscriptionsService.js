import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const calculateNextOccurrence = (currentDateStr, frequency) => {
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

export const processRecurringTransactions = async (userId, targetDateStr = null) => {
  const todayStr = targetDateStr || new Date().toISOString().slice(0, 10);
  
  const dueItems = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextOccurrence: { lte: todayStr }
    }
  });

  const generated = [];

  for (const item of dueItems) {
    if (item.lastProcessedDate === item.nextOccurrence) {
      const updatedNext = calculateNextOccurrence(item.nextOccurrence, item.frequency);
      
      let stillActive = true;
      if (item.endDate && updatedNext > item.endDate) stillActive = false;
      if (item.cancellationDate && updatedNext > item.cancellationDate) stillActive = false;

      await prisma.recurringTransaction.update({
        where: { id: item.id },
        data: {
          nextOccurrence: updatedNext,
          isActive: stillActive
        }
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const createdTx = await tx.transaction.create({
        data: {
          amount: item.amount,
          type: item.type,
          category: item.category,
          note: item.notes ? `${item.notes} (Recurring: ${item.name})` : `Recurring payment: ${item.name}`,
          date: item.nextOccurrence,
          userId: item.userId
        }
      });

      const updatedNext = calculateNextOccurrence(item.nextOccurrence, item.frequency);
      
      let stillActive = true;
      if (item.endDate && updatedNext > item.endDate) stillActive = false;
      if (item.cancellationDate && updatedNext > item.cancellationDate) stillActive = false;

      await tx.recurringTransaction.update({
        where: { id: item.id },
        data: {
          lastProcessedDate: item.nextOccurrence,
          nextOccurrence: updatedNext,
          isActive: stillActive
        }
      });

      generated.push(createdTx);
    });
  }

  return generated;
};

export const fetchRecurring = async (userId, isSubscription) => {
  const where = { userId };
  if (isSubscription !== undefined) {
    where.isSubscription = isSubscription === 'true';
  }
  const items = await prisma.recurringTransaction.findMany({
    where,
    orderBy: { nextOccurrence: 'asc' }
  });
  return items.map(item => ({
    ...item,
    amount: parseFloat(item.amount)
  }));
};

export const createRecurring = async (userId, data) => {
  const { 
    name, 
    amount, 
    type, 
    category, 
    frequency, 
    startDate, 
    endDate, 
    notes,
    isSubscription,
    provider,
    cancellationDate
  } = data;

  const item = await prisma.recurringTransaction.create({
    data: {
      name,
      amount: amount.toString(),
      type,
      category,
      frequency,
      startDate,
      endDate: endDate || null,
      nextOccurrence: startDate,
      notes: notes || null,
      isSubscription: isSubscription || false,
      provider: provider || null,
      cancellationDate: cancellationDate || null,
      userId
    }
  });

  return {
    ...item,
    amount: parseFloat(item.amount)
  };
};

export const updateRecurring = async (itemId, userId, data) => {
  const { 
    name, 
    amount, 
    type, 
    category, 
    frequency, 
    startDate, 
    endDate, 
    nextOccurrence,
    notes,
    isSubscription,
    provider,
    cancellationDate,
    isActive
  } = data;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (amount !== undefined) updateData.amount = amount.toString();
  if (type !== undefined) updateData.type = type;
  if (category !== undefined) updateData.category = category;
  if (frequency !== undefined) updateData.frequency = frequency;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate || null;
  if (nextOccurrence !== undefined) updateData.nextOccurrence = nextOccurrence;
  if (notes !== undefined) updateData.notes = notes || null;
  if (isSubscription !== undefined) updateData.isSubscription = isSubscription;
  if (provider !== undefined) updateData.provider = provider || null;
  if (cancellationDate !== undefined) updateData.cancellationDate = cancellationDate || null;
  if (isActive !== undefined) updateData.isActive = isActive;

  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: parseInt(itemId), userId }
  });

  if (!existing) {
    return null;
  }

  const item = await prisma.recurringTransaction.update({
    where: { id: existing.id },
    data: updateData
  });

  return {
    ...item,
    amount: parseFloat(item.amount)
  };
};

export const deleteRecurring = async (itemId, userId) => {
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: parseInt(itemId), userId }
  });
  if (!existing) {
    return null;
  }
  return prisma.recurringTransaction.delete({
    where: { id: existing.id }
  });
};
