const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- ALL ORDERS ---');
  const orders = await prisma.order.findMany();
  orders.forEach((o) => {
    console.log(`Order: ${o.orderNumber} | Customer: ${o.customerName} | Phone: ${o.customerPhone} | City: ${o.city}`);
  });

  console.log('--- ALL WATCH REQUESTS ---');
  const requests = await prisma.watchRequest.findMany();
  requests.forEach((r) => {
    console.log(`Request ID: ${r.id} | Name: ${r.fullName} | Phone: ${r.phoneNumber} | City: ${r.city}`);
  });
}

main().finally(() => prisma.$disconnect());
