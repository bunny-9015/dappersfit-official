const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'admin@dappersfit.com' },
        { phone: { contains: '98201' } },
        { name: { contains: 'Rahul' } },
      ],
    },
  });
  console.log('Deleted unwanted users:', deletedUsers);

  const deletedOrders = await prisma.order.deleteMany({
    where: {
      OR: [
        { customerPhone: { contains: '98201' } },
        { customerName: { contains: 'Rahul' } },
      ],
    },
  });
  console.log('Deleted unwanted orders:', deletedOrders);

  const remainingUsers = await prisma.user.findMany();
  console.log('REMAINING ACCOUNTS:');
  remainingUsers.forEach((u) => {
    console.log(`- [${u.role}] ${u.email} | Name: ${u.name} | Phone: ${u.phone}`);
  });
}

main().finally(() => prisma.$disconnect());
