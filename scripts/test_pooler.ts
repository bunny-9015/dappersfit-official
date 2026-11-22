import { PrismaClient } from '@prisma/client';

async function testPooler(port: number, pgbouncer: boolean) {
  const url = `postgresql://postgres.thxobtxrstnmjnwodxxs:bunny9015%409015@aws-0-ap-south-1.pooler.supabase.com:${port}/postgres${pgbouncer ? '?pgbouncer=true' : ''}`;
  console.log(`Testing pooler on port ${port} (pgbouncer=${pgbouncer})...`);
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    const count = await prisma.product.count();
    console.log(`✅ Success on port ${port}! Total products: ${count}`);
    await prisma.$disconnect();
    return true;
  } catch (err: unknown) {
    console.error(`❌ Failed on port ${port}:`, err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  await testPooler(5432, false);
  await testPooler(6543, true);
}

main();
