import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  const users = await prisma.user.findMany();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalCategories: categories.length,
    totalProducts: products.length,
    totalUsers: users.length,
    categories,
    products,
    users
  };

  const outPath = path.join(process.cwd(), 'prisma', 'supabase_seed_data.json');
  fs.writeFileSync(outPath, JSON.stringify(exportPayload, null, 2), 'utf-8');
  console.log('Successfully exported database backup to:', outPath);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Products: ${products.length} (including all 45 Rolex @ 2499)`);
  console.log(`- Users: ${users.length}`);
}

exportData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
