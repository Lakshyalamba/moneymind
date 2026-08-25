import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fetchGoals = async (userId) => {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return goals.map(g => ({
    ...g,
    targetAmount: parseFloat(g.targetAmount),
    currentAmount: parseFloat(g.currentAmount)
  }));
};

export const createGoal = async (userId, goalData) => {
  const { title, targetAmount, currentAmount, deadline } = goalData;

  const goal = await prisma.goal.create({
    data: {
      title,
      targetAmount: targetAmount.toString(),
      currentAmount: (currentAmount || 0).toString(),
      deadline,
      userId
    }
  });

  return {
    ...goal,
    targetAmount: parseFloat(goal.targetAmount),
    currentAmount: parseFloat(goal.currentAmount)
  };
};

export const updateGoal = async (goalId, userId, goalData) => {
  const { title, targetAmount, currentAmount, deadline } = goalData;

  const existing = await prisma.goal.findFirst({
    where: { id: parseInt(goalId), userId }
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.goal.update({
    where: { id: existing.id },
    data: {
      ...(title && { title }),
      ...(targetAmount && { targetAmount: targetAmount.toString() }),
      ...(currentAmount !== undefined && { currentAmount: currentAmount.toString() }),
      ...(deadline && { deadline })
    }
  });

  return {
    ...updated,
    targetAmount: parseFloat(updated.targetAmount),
    currentAmount: parseFloat(updated.currentAmount)
  };
};

export const deleteGoal = async (goalId, userId) => {
  const existing = await prisma.goal.findFirst({
    where: { id: parseInt(goalId), userId }
  });

  if (!existing) {
    return null;
  }

  return prisma.goal.delete({
    where: { id: existing.id }
  });
};
