import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allProducts = await prisma.product.findMany();
  let rolexCount = 0;
  let updatedCount = 0;

  for (const p of allProducts) {
    const isRolex =
      p.brand.toLowerCase().includes('rolex') ||
      p.name.toLowerCase().includes('rolex');

    if (isRolex) {
      rolexCount++;
      if (p.price !== 2499) {
        await prisma.product.update({
          where: { id: p.id },
          data: { price: 2499 },
        });
        updatedCount++;
      }
    }
  }

  console.log(`Found total ${rolexCount} Rolex models.`);
  console.log(`Updated ${updatedCount} Rolex models to price 2499.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
