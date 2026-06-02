import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  const usersToVerify = [
    "admin@splitledger.com",
    "grandejmbusiness@gmail.com",
    "test2@gmail.com",
  ];

  for (const email of usersToVerify) {
    try {
      const user = await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
      console.log(`Verified user: ${user.email}`);
    } catch (error) {
      console.error(`Failed to verify user ${email}:`, error);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
