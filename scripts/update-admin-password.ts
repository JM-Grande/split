import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@example.com';
  // Generating a secure, random 12-character password
  const randomSuffix = Math.random().toString(36).slice(-6);
  const plainTextPassword = `Admin${randomSuffix}!`;
  
  console.log('Generating bcrypt(12) hash...');
  const hashedPassword = await bcrypt.hash(plainTextPassword, 12);
  
  console.log('Updating database...');
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`\n=========================================`);
  console.log(`Success! Password for ${email} updated to:`);
  console.log(`Password: ${plainTextPassword}`);
  console.log(`=========================================\n`);
}

main()
  .catch(e => {
    console.error('Error updating password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
