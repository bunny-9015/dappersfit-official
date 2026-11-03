const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS SEARCH ---');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Rahul' } },
        { phone: { contains: '98201' } },
        { email: { contains: 'rahul' } },
      ],
    },
  });
  console.log('Found users:', users);

  console.log('--- ALL USERS ---');
  const allUsers = await prisma.user.findMany();
  allUsers.forEach((u) => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role} | Phone: ${u.phone} | City: ${u.city}`);
  });

  console.log('--- ORDERS WITH RAHUL / 98201 ---');
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerName: { contains: 'Rahul' } },
        { customerPhone: { contains: '98201' } },
      ],
    },
  });
  console.log('Found orders:', orders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, name: o.customerName, phone: o.customerPhone })));
}

main().finally(() => prisma.$disconnect());
