const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  users.forEach((u) => {
    console.log(`- [${u.role}] ${u.email} (${u.name})`);
  });
}

main().finally(() => prisma.$disconnect());
