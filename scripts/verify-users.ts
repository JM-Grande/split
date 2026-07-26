import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  const usersToVerify = ["Admin", "Partner"];

  for (const name of usersToVerify) {
    try {
      const user = await prisma.user.findUnique({
        where: { name },
      });
      if (user) {
        console.log(`Found user: ${user.name}`);
      }
    } catch (error) {
      console.error(`Failed to find user ${name}:`, error);
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
