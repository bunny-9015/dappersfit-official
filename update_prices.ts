import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePrices() {
  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const product of products) {
    const b = product.brand.toLowerCase();
    const n = product.name.toLowerCase();
    let newPrice = product.price; // default to current

    if (b === 'carrera') newPrice = 3999;
    else if (b === 'casio') newPrice = 1499;
    else if (b === 'diesel') {
      if (n.includes('big daddy')) newPrice = 3999;
      else newPrice = 2999;
    }
    else if (b === 'fossil') {
      if (n.includes('ladies') || n.includes('women')) newPrice = 2799;
      else newPrice = 2999;
    }
    else if (b === 'g-shock' || b === 'gshock') newPrice = 2499;
    else if (b === 'hublot') newPrice = 2499;
    else if (b === 'invicta') newPrice = 2999;
    else if (b === 'michael kors' || b.includes('michael')) newPrice = 2799;
    else if (b === 'omega') newPrice = 4500;
    else if (b === 'patek philippe' || b === 'patek') newPrice = 3999;
    else if (b === 'rado') newPrice = 2499;
    else if (b === 'tissot') newPrice = 2499;
    else if (b === 'versace') newPrice = 2499;

    if (newPrice !== product.price) {
      await prisma.product.update({
        where: { id: product.id },
        data: { price: newPrice }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated prices for ${updatedCount} watches!`);
}

updatePrices()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
