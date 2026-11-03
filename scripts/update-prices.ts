import prisma from '../src/lib/prisma';

async function updatePrices() {
  console.log('Updating Fossil (LADIES) to 2799...');
  const fossilLadies = await prisma.product.updateMany({
    where: { brand: 'Fossil (LADIES)' },
    data: { price: 2799 }
  });
  console.log(`Updated ${fossilLadies.count} Fossil (LADIES) watches.`);

  console.log('Updating G - shock to 2499...');
  const gshock = await prisma.product.updateMany({
    where: { brand: 'G - shock' },
    data: { price: 2499 }
  });
  console.log(`Updated ${gshock.count} G - shock watches.`);

  // Verify all products across all brands
  const allProducts = await prisma.product.findMany({
    select: { brand: true, price: true }
  });

  const byBrand: Record<string, number[]> = {};
  for (const p of allProducts) {
    if (!byBrand[p.brand]) byBrand[p.brand] = [];
    byBrand[p.brand].push(p.price);
  }

  console.log('\n=== CURRENT DB STATUS BY BRAND ===');
  for (const [brand, prices] of Object.entries(byBrand).sort()) {
    const distinct = Array.from(new Set(prices));
    console.log(`${brand}: Count = ${prices.length}, Prices = ${JSON.stringify(distinct)}`);
  }
}

updatePrices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
