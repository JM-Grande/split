import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from 'bcryptjs';
import { createWeeklySale } from '../lib/domain/sales';

const adapter = new PrismaBetterSqlite3({ url: "prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

interface SeedEntry {
  date: Date;
  gross: number;
  expenses: number;
  expense_type?: string;
  notes?: string;
}

const SEED_PASSWORD = 'Password123!';
const SALT_ROUNDS = 12;

function generateRandomData(weeks: number, startDate: Date): SeedEntry[] {
  const data: SeedEntry[] = [];
  const expenseTypes = ['Electricity', 'Internet', 'Maintenance', 'Rent', 'Supplies'];
  const possibleNotes = [
    'Good week overall.',
    'Slow traffic due to weather.',
    'Holiday bump!',
    'Repaired some units.',
    'Lots of regular customers.',
    'Quiet week.',
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  const currentDate = new Date(startDate);
  
  for (let i = 0; i < weeks; i++) {
    // Random gross between 4000 and 8000
    const gross = Math.floor(Math.random() * (8000 - 4000 + 1) + 4000); 
    // Random expenses between 500 and 1500
    const expenses = Math.floor(Math.random() * (1500 - 500 + 1) + 500); 
    const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
    const note = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];

    data.push({
      date: new Date(currentDate),
      gross,
      expenses,
      expense_type: expenseType,
      notes: note,
    });

    // Advance by 7 days
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return data;
}

// Generate 52 weeks (1 year) of random data for admin starting Jan 7, 2024
const adminSalesData: SeedEntry[] = generateRandomData(52, new Date('2024-01-07T00:00:00Z'));

// Generate 12 weeks of random data for partner starting Jan 5, 2025
const partnerSalesData: SeedEntry[] = generateRandomData(12, new Date('2025-01-05T00:00:00Z'));

async function main() {
  console.log('🌱 Starting database seed...');

  // --- Cleanup ---
  await prisma.weeklySale.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing data.');

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
  const hashedRecoveryKey = await bcrypt.hash('SPLT-SEED-KEY1-1234', SALT_ROUNDS);
  const now = new Date();

  // --- Create Users ---
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      recoveryKey: hashedRecoveryKey,
      emailVerified: now,
    },
  });

  const partner = await prisma.user.create({
    data: {
      name: 'Partner User',
      email: 'partner@example.com',
      password: hashedPassword,
      recoveryKey: hashedRecoveryKey,
      emailVerified: now,
    },
  });

  console.log(`✅ Created users: ${admin.email}, ${partner.email}`);

  // --- Seed Admin Sales Records ---
  let adminCount = 0;
  for (const entry of adminSalesData) {
    const result = createWeeklySale({ grossSales: entry.gross, primaryExpenses: entry.expenses, primarySplitPercentage: 60 });
    if (!result.success) continue;

    await prisma.weeklySale.create({
      data: {
        user_id: admin.id,
        date: entry.date,
        weekly_sales: entry.gross,
        primary_split_percentage: 60,
        primary_share: result.data.primaryShare,
        secondary_share: result.data.secondaryShare,
        primary_expenses: entry.expenses,
        expense_type: entry.expense_type ?? null,
        primary_net_revenue: result.data.primaryNetRevenue,
        notes: entry.notes ?? null,
      },
    });
    adminCount++;
  }

  // --- Seed Partner Sales Records ---
  let partnerCount = 0;
  for (const entry of partnerSalesData) {
    const result = createWeeklySale({ grossSales: entry.gross, primaryExpenses: entry.expenses, primarySplitPercentage: 60 });
    if (!result.success) continue;

    await prisma.weeklySale.create({
      data: {
        user_id: partner.id,
        date: entry.date,
        weekly_sales: entry.gross,
        primary_split_percentage: 60,
        primary_share: result.data.primaryShare,
        secondary_share: result.data.secondaryShare,
        primary_expenses: entry.expenses,
        expense_type: entry.expense_type ?? null,
        primary_net_revenue: result.data.primaryNetRevenue,
        notes: entry.notes ?? null,
      },
    });
    partnerCount++;
  }

  console.log(`✅ Seeded ${adminCount} randomized records for ${admin.email}`);
  console.log(`✅ Seeded ${partnerCount} randomized records for ${partner.email}`);
  console.log('');
  console.log('🔑 Seed credentials (both accounts):');
  console.log(`   Password: ${SEED_PASSWORD}`);
  console.log(`   Recovery Key: SPLT-SEED-KEY1-1234`);
  console.log('');
  console.log('🎉 Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
