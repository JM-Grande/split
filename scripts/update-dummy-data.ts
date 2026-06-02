import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const sales = await prisma.weeklySale.findMany({
    orderBy: { date: 'desc' }
  });

  if (sales.length >= 3) {
    // 1. Update the first record with extremely long expense type and note
    await prisma.weeklySale.update({
      where: { record_id: sales[0].record_id },
      data: {
        expense_type: "Internet Bill (PLDT), Electricity (Meralco), Water Supply, and Routine Maintenance for Terminal 4 & 5",
        notes: "This week had unexpectedly high expenses due to a fiber cut that required an emergency repair from PLDT, plus the scheduled aircon cleaning which took half a day. Sales dipped slightly on Tuesday due to the downtime but recovered strongly over the weekend."
      }
    });

    // 2. Update the second record with a moderate expense type and long note
    await prisma.weeklySale.update({
      where: { record_id: sales[1].record_id },
      data: {
        expense_type: "Electricity & Cleaning",
        notes: "Normal operations. Added some new peripherals (mice and keyboards) to terminals 1-3. Customer volume was higher than usual on Friday night."
      }
    });

    // 3. Ensure the third record remains null to test the empty state placeholders
    await prisma.weeklySale.update({
      where: { record_id: sales[2].record_id },
      data: {
        expense_type: null,
        notes: null
      }
    });

    console.log("Successfully updated dummy data with long text strings.");
  } else {
    console.log("Not enough sales records found to update. Please run the seed command first.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
