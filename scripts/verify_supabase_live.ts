import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const info = await prisma.$queryRaw<
    Array<{ current_database: string; current_user: string; version: string }>
  >`SELECT current_database(), current_user, version()`;
  console.log('=== LIVE SUPABASE POSTGRESQL VERIFICATION ===');
  console.log('Connected Database:', info[0].current_database);
  console.log('PostgreSQL User:', info[0].current_user);
  console.log('PostgreSQL Version:', info[0].version);

  const productCount = await prisma.product.count();
  const rolexCount = await prisma.product.count({
    where: { brand: 'Rolex' }
  });
  const sampleRolex = await prisma.product.findFirst({
    where: { brand: 'Rolex' }
  });

  console.log('\n--- LIVE DATA CHECK ---');
  console.log(`Total Products in Supabase Cloud: ${productCount}`);
  console.log(`Total Rolex Models: ${rolexCount}`);
  console.log(`Sample Rolex Name: ${sampleRolex?.name}`);
  console.log(`Sample Rolex Price: ₹${sampleRolex?.price}`);
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
