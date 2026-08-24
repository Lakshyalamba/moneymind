import '../src/loadEnv.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Create or find the demo user
    const demoEmail = 'moneymind@gmail.com';
    const demoPassword = 'happytransactions';

    let user = await prisma.user.findUnique({
        where: { email: demoEmail }
    });

    if (!user) {
        console.log('Creating demo user...');
        const hashedPassword = await bcrypt.hash(demoPassword, 10);
        user = await prisma.user.create({
            data: {
                email: demoEmail,
                password: hashedPassword,
                name: 'Demo User',
                phone: '+1234567890',
                bio: 'This is a demo account with sample transactions'
            }
        });
        console.log(`✅ Created demo user: ${user.email}`);
    } else {
        console.log(`Using existing demo user: ${user.email}`);
    }

    // 2. Clean up existing user data to keep it idempotent
    console.log('Cleaning up existing data...');
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.budget.deleteMany({ where: { userId: user.id } });
    await prisma.goal.deleteMany({ where: { userId: user.id } });

    // Helper to generate dates relative to today
    const today = new Date();
    const getPastDateStr = (daysAgo) => {
        const d = new Date(today);
        d.setDate(today.getDate() - daysAgo);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    console.log('Seeding dynamically generated transactions...');
    
    // Generate a set of income and expenses for the last 6 months (approx 180 days)
    const transactions = [];

    // Monthly incomes (Salary and Freelance)
    for (let i = 0; i < 6; i++) {
        const salaryDaysAgo = i * 30 + (today.getDate() - 1); // around 1st of each month
        if (salaryDaysAgo < 180) {
            transactions.push({
                amount: 35000.00,
                type: 'income',
                category: 'Salary',
                note: `Salary for month -${i}`,
                date: getPastDateStr(salaryDaysAgo),
                userId: user.id
            });
        }

        const freelanceDaysAgo = i * 30 + 15; // around 15th of each month
        if (freelanceDaysAgo < 180) {
            transactions.push({
                amount: 8000.00,
                type: 'income',
                category: 'Freelance',
                note: `Web development milestone -${i}`,
                date: getPastDateStr(freelanceDaysAgo),
                userId: user.id
            });
        }
    }

    // Monthly fixed expenses
    for (let i = 0; i < 6; i++) {
        const rentDaysAgo = i * 30 + (today.getDate() - 2); // 2nd of each month
        if (rentDaysAgo < 180) {
            transactions.push({
                amount: 12000.00,
                type: 'expense',
                category: 'Housing',
                note: `Apartment Rent month -${i}`,
                date: getPastDateStr(rentDaysAgo),
                userId: user.id
            });
        }

        const utilDaysAgo = i * 30 + 5; // 5th of each month
        if (utilDaysAgo < 180) {
            transactions.push({
                amount: 3200.00,
                type: 'expense',
                category: 'Utilities',
                note: `Electricity & Internet bill month -${i}`,
                date: getPastDateStr(utilDaysAgo),
                userId: user.id
            });
        }
    }

    // Variable expenses (Food, Shopping, Entertainment, Transport, Healthcare)
    // We populate expenses across the last 180 days randomly
    const categories = [
        { category: 'Food & Dining', min: 150, max: 1200, note: 'Lunch / Dinner / Groceries' },
        { category: 'Shopping', min: 500, max: 5000, note: 'Clothing / Electronics' },
        { category: 'Transportation', min: 80, max: 600, note: 'Cab ride / Fuel' },
        { category: 'Entertainment', min: 200, max: 2500, note: 'Movie / Concert / Outing' },
        { category: 'Healthcare', min: 300, max: 1500, note: 'Medicines / Doctor consultation' }
    ];

    // Seed 60 variable expense transactions randomly distributed over 180 days
    for (let i = 0; i < 60; i++) {
        const daysAgo = Math.floor(Math.random() * 175); // distribute in last 175 days
        const catObj = categories[Math.floor(Math.random() * categories.length)];
        const amount = Math.floor(Math.random() * (catObj.max - catObj.min) + catObj.min);
        
        transactions.push({
            amount,
            type: 'expense',
            category: catObj.category,
            note: catObj.note,
            date: getPastDateStr(daysAgo),
            userId: user.id
        });
    }

    // Create all transactions in database
    for (const tx of transactions) {
        await prisma.transaction.create({ data: tx });
    }
    console.log(`✅ Successfully seeded ${transactions.length} transactions!`);

    // 3. Seed category budgets
    console.log('Seeding category budgets...');
    const budgets = [
        { category: 'Food & Dining', limit: 12000.00 },
        { category: 'Shopping', limit: 8000.00 },
        { category: 'Transportation', limit: 3000.00 },
        { category: 'Entertainment', limit: 5000.00 },
        { category: 'Utilities', limit: 4000.00 }
    ];

    for (const b of budgets) {
        await prisma.budget.create({
            data: {
                category: b.category,
                limit: b.limit,
                userId: user.id
            }
        });
    }
    console.log(`✅ Successfully seeded ${budgets.length} budgets!`);

    // 4. Seed goals
    console.log('Seeding goals...');
    const deadline1 = new Date();
    deadline1.setMonth(today.getMonth() + 6);
    const deadline2 = new Date();
    deadline2.setMonth(today.getMonth() + 12);

    const formatDeadline = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    };

    const goals = [
        {
            title: 'Emergency Fund',
            targetAmount: 50000.00,
            currentAmount: 25000.00,
            deadline: formatDeadline(deadline1),
            userId: user.id
        },
        {
            title: 'New Laptop',
            targetAmount: 90000.00,
            currentAmount: 40000.00,
            deadline: formatDeadline(deadline2),
            userId: user.id
        }
    ];

    for (const g of goals) {
        await prisma.goal.create({ data: g });
    }
    console.log(`✅ Successfully seeded ${goals.length} goals!`);

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
