import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const name = 'Admin';
  const newPin = '1234';
  
  console.log('Generating bcrypt(12) hash for 4-digit PIN...');
  const hashedPassword = await bcrypt.hash(newPin, 12);
  
  console.log('Updating database...');
  await prisma.user.update({
    where: { name },
    data: { password: hashedPassword }
  });
  
  console.log(`\n=========================================`);
  console.log(`Success! PIN for user ${name} updated to:`);
  console.log(`PIN: ${newPin}`);
  console.log(`=========================================\n`);
}

main()
  .catch(e => {
    console.error('Error updating PIN:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
