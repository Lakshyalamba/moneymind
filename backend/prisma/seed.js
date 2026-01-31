import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Create or find the demo user
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

    // Create 15 demo transactions with varied data
    const transactions = [
        {
            amount: 45.50,
            type: 'expense',
            category: 'Food & Dining',
            note: 'Lunch at Cafe Milano',
            date: '2026-01-28',
            userId: user.id
        },
        {
            amount: 3500.00,
            type: 'income',
            category: 'Salary',
            note: 'Monthly salary',
            date: '2026-01-25',
            userId: user.id
        },
        {
            amount: 120.00,
            type: 'expense',
            category: 'Shopping',
            note: 'New shoes',
            date: '2026-01-27',
            userId: user.id
        },
        {
            amount: 65.00,
            type: 'expense',
            category: 'Transportation',
            note: 'Uber rides',
            date: '2026-01-26',
            userId: user.id
        },
        {
            amount: 200.00,
            type: 'income',
            category: 'Freelance',
            note: 'Web design project',
            date: '2026-01-24',
            userId: user.id
        },
        {
            amount: 89.99,
            type: 'expense',
            category: 'Entertainment',
            note: 'Movie tickets and dinner',
            date: '2026-01-23',
            userId: user.id
        },
        {
            amount: 1200.00,
            type: 'expense',
            category: 'Housing',
            note: 'Monthly rent',
            date: '2026-01-01',
            userId: user.id
        },
        {
            amount: 35.00,
            type: 'expense',
            category: 'Food & Dining',
            note: 'Grocery shopping',
            date: '2026-01-22',
            userId: user.id
        },
        {
            amount: 150.00,
            type: 'expense',
            category: 'Healthcare',
            note: 'Medical checkup',
            date: '2026-01-20',
            userId: user.id
        },
        {
            amount: 50.00,
            type: 'income',
            category: 'Gift',
            note: 'Birthday gift from friend',
            date: '2026-01-19',
            userId: user.id
        },
        {
            amount: 85.00,
            type: 'expense',
            category: 'Utilities',
            note: 'Electricity bill',
            date: '2026-01-15',
            userId: user.id
        },
        {
            amount: 29.99,
            type: 'expense',
            category: 'Entertainment',
            note: 'Netflix subscription',
            date: '2026-01-10',
            userId: user.id
        },
        {
            amount: 42.50,
            type: 'expense',
            category: 'Food & Dining',
            note: 'Coffee and pastries',
            date: '2026-01-18',
            userId: user.id
        },
        {
            amount: 180.00,
            type: 'expense',
            category: 'Shopping',
            note: 'Winter jacket',
            date: '2026-01-12',
            userId: user.id
        },
        {
            amount: 500.00,
            type: 'income',
            category: 'Bonus',
            note: 'Performance bonus',
            date: '2026-01-05',
            userId: user.id
        }
    ];

    // Create all transactions
    for (const transaction of transactions) {
        await prisma.transaction.create({
            data: transaction
        });
    }

    console.log('✅ Successfully created 15 demo transactions!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
