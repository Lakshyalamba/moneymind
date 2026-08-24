import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkAndGenerateAlerts = async (userId) => {
  try {
    const today = new Date();
    const curMonthStr = today.toISOString().slice(0, 7);

    // 1. Budgets Alerts
    const budgets = await prisma.budget.findMany({ where: { userId } });
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { startsWith: curMonthStr }, type: 'expense' }
    });

    for (const b of budgets) {
      const spent = transactions
        .filter(t => t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const limit = parseFloat(b.limit);
      if (limit <= 0) continue;
      const percentageUsed = (spent / limit) * 100;

      let type = 'budget_warning';
      let title = '';
      let message = '';
      let threshold = 0;

      if (percentageUsed >= 100) {
        type = 'budget_exceeded';
        title = `Budget Exceeded: ${b.category}`;
        message = `You spent ₹${spent.toLocaleString('en-IN')} exceeding your budget limit of ₹${limit.toLocaleString('en-IN')}.`;
        threshold = 100;
      } else if (percentageUsed >= 90) {
        title = `High Alert: ${b.category} Budget`;
        message = `You have used ${percentageUsed.toFixed(0)}% of your ₹${limit.toLocaleString('en-IN')} budget limit.`;
        threshold = 90;
      } else if (percentageUsed >= 75) {
        title = `Warning: ${b.category} Budget`;
        message = `You have used ${percentageUsed.toFixed(0)}% of your ₹${limit.toLocaleString('en-IN')} budget limit.`;
        threshold = 75;
      } else if (percentageUsed >= 50) {
        title = `Info: ${b.category} Budget`;
        message = `You have used ${percentageUsed.toFixed(0)}% of your ₹${limit.toLocaleString('en-IN')} budget limit.`;
        threshold = 50;
      }

      if (threshold > 0) {
        const refId = `budget-${b.id}-${threshold}`;
        await prisma.notification.upsert({
          where: { userId_refId: { userId, refId } },
          update: {},
          create: { userId, type, title, message, refId }
        });
      }
    }

    // 2. Upcoming Recurring & Subscription Alerts
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    const threeDaysLaterStr = `${threeDaysLater.getFullYear()}-${String(threeDaysLater.getMonth() + 1).padStart(2, '0')}-${String(threeDaysLater.getDate()).padStart(2, '0')}`;
    const todayStr = today.toISOString().slice(0, 10);

    const recurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextOccurrence: { gte: todayStr, lte: threeDaysLaterStr }
      }
    });

    for (const item of recurring) {
      const type = item.isSubscription ? 'upcoming_subscription' : 'upcoming_recurring';
      const title = item.isSubscription ? 'Upcoming Subscription Renewal' : 'Upcoming Scheduled Bill';
      const message = `Your ${item.isSubscription ? 'subscription' : 'scheduled bill'} for ${item.name} of ₹${parseFloat(item.amount).toLocaleString('en-IN')} is due on ${item.nextOccurrence}.`;
      const refId = `recurring-${item.id}-${item.nextOccurrence}`;

      await prisma.notification.upsert({
        where: { userId_refId: { userId, refId } },
        update: {},
        create: { userId, type, title, message, refId }
      });
    }

    // 3. Goal Milestones
    const goals = await prisma.goal.findMany({ where: { userId } });
    for (const g of goals) {
      const target = parseFloat(g.targetAmount);
      const current = parseFloat(g.currentAmount);
      if (target <= 0) continue;
      const progress = (current / target) * 100;

      let title = '';
      let message = '';
      let milestone = 0;

      if (progress >= 100) {
        title = `Goal Achieved: ${g.title}`;
        message = `Congratulations! You have reached 100% of your ₹${target.toLocaleString('en-IN')} target for ${g.title}!`;
        milestone = 100;
      } else if (progress >= 90) {
        title = `Almost There: ${g.title}`;
        message = `You have reached ${progress.toFixed(0)}% of your ₹${target.toLocaleString('en-IN')} target for ${g.title}.`;
        milestone = 90;
      } else if (progress >= 50) {
        title = `Halfway Milestone: ${g.title}`;
        message = `You have reached ${progress.toFixed(0)}% of your ₹${target.toLocaleString('en-IN')} target for ${g.title}.`;
        milestone = 50;
      }

      if (milestone > 0) {
        const refId = `goal-${g.id}-${milestone}`;
        await prisma.notification.upsert({
          where: { userId_refId: { userId, refId } },
          update: {},
          create: { userId, type: 'goal_milestone', title, message, refId }
        });
      }
    }

    // 4. Unusual Spending Alerts
    const anomalies = await prisma.transaction.findMany({
      where: { userId, isAnomaly: true }
    });
    for (const tx of anomalies) {
      const refId = `anomaly-${tx.id}`;
      await prisma.notification.upsert({
        where: { userId_refId: { userId, refId } },
        update: {},
        create: {
          userId,
          type: 'unusual_spending',
          title: 'Unusual Spending Detected',
          message: `Unusual spend of ₹${parseFloat(tx.amount).toLocaleString('en-IN')} in category ${tx.category} on ${tx.date}. ${tx.anomalyReason}`,
          refId
        }
      });
    }

  } catch (err) {
    console.error('Error generating alerts:', err.message);
  }
};

export const fetchNotifications = async (userId) => {
  await checkAndGenerateAlerts(userId);
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

export const markAsRead = async (notificationId, userId) => {
  return prisma.notification.update({
    where: { id: parseInt(notificationId), userId },
    data: { isRead: true }
  });
};

export const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
};

export const deleteNotification = async (notificationId, userId) => {
  return prisma.notification.delete({
    where: { id: parseInt(notificationId), userId }
  });
};

export const clearAllNotifications = async (userId) => {
  return prisma.notification.deleteMany({
    where: { userId }
  });
};
