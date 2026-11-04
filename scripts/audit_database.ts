import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  const brands = await prisma.product.groupBy({
    by: ['brand'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  const categoryCount = await prisma.category.count();
  const orderCount = await prisma.order.count();
  const requestCount = await prisma.watchRequest.count();
  const userCount = await prisma.user.count();

  console.log('=== DAPPERSFIT DATABASE AUDIT (CURRENT SQLITE) ===');
  console.log(`Total Products: ${productCount}`);
  console.log(`Total Categories: ${categoryCount}`);
  console.log(`Total Orders: ${orderCount}`);
  console.log(`Total Watch Requests: ${requestCount}`);
  console.log(`Total Users: ${userCount}`);
  console.log('\n--- BRAND BREAKDOWN (ALL WATCHES) ---');
  brands.forEach((b) => {
    console.log(`  - ${b.brand}: ${b._count.id} models`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
