const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'adminlikesh@gmail.com' },
  });
  console.log('User:', user?.email, user?.role, user?.name);
  console.log('Hash:', user?.passwordHash);
}

main().finally(() => prisma.$disconnect());
