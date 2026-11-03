import prisma from '../src/lib/prisma';

async function applyFinalPrices() {
  console.log('--- Applying All Brand Prices ---');

  // 1. Carrera - 3999
  await prisma.product.updateMany({
    where: { brand: 'Carrera' },
    data: { price: 3999 }
  });

  // 2. Casio - 1499
  await prisma.product.updateMany({
    where: { brand: 'Casio' },
    data: { price: 1499 }
  });

  // 3. Diesel & Diesel Big Daddy
  // Update Diesel Model 1-6 as Diesel Big Daddy (3999), Model 7-12 as Diesel (2999)
  const dieselWatches = await prisma.product.findMany({
    where: { OR: [{ brand: 'Diesel' }, { brand: 'Diesel Big Daddy' }] },
    orderBy: { name: 'asc' }
  });

  for (let i = 0; i < dieselWatches.length; i++) {
    const watch = dieselWatches[i];
    if (i < 6) {
      await prisma.product.update({
        where: { id: watch.id },
        data: {
          brand: 'Diesel Big Daddy',
          name: watch.name.replace('Diesel Model', 'Diesel Big Daddy Model'),
          price: 3999
        }
      });
    } else {
      await prisma.product.update({
        where: { id: watch.id },
        data: {
          brand: 'Diesel',
          name: watch.name.replace('Diesel Big Daddy Model', 'Diesel Model'),
          price: 2999
        }
      });
    }
  }

  // 4. Fossil - 2999
  await prisma.product.updateMany({
    where: { brand: 'Fossil' },
    data: { price: 2999 }
  });

  // 5. Fossil ladies - 2799
  await prisma.product.updateMany({
    where: { brand: 'Fossil (LADIES)' },
    data: { price: 2799 }
  });

  // 6. Gshock - 2499
  await prisma.product.updateMany({
    where: { brand: 'G - shock' },
    data: { price: 2499 }
  });

  // 7. Hublot - 2499
  await prisma.product.updateMany({
    where: { brand: 'Hublot' },
    data: { price: 2499 }
  });

  // 8. Invicta - 2999
  await prisma.product.updateMany({
    where: { brand: 'INVICTA' },
    data: { price: 2999 }
  });

  // 9. Michael Kors both - 2799
  await prisma.product.updateMany({
    where: { brand: { in: ['Michael kors', 'Michael kors(Ladies)'] } },
    data: { price: 2799 }
  });

  // 10. Omega - 4500
  await prisma.product.updateMany({
    where: { brand: 'Omega' },
    data: { price: 4500 }
  });

  // 11. Patek - 3999
  await prisma.product.updateMany({
    where: { brand: 'Patek Philippe' },
    data: { price: 3999 }
  });

  // 12. Rado - 2499
  await prisma.product.updateMany({
    where: { brand: 'Rado' },
    data: { price: 2499 }
  });

  // 13. Tissot - 2499
  await prisma.product.updateMany({
    where: { brand: 'Tissot' },
    data: { price: 2499 }
  });

  // 14. Versace - 2499
  await prisma.product.updateMany({
    where: { brand: 'Versace' },
    data: { price: 2499 }
  });

  // 15. Rolex - 3999 (Eliminating all lakhs prices from the screenshot!)
  await prisma.product.updateMany({
    where: { brand: 'Rolex' },
    data: { price: 3999 }
  });

  // 16. Richard Mille - 4500 (Eliminating all lakhs prices!)
  await prisma.product.updateMany({
    where: { brand: 'Richard mille' },
    data: { price: 4500 }
  });

  // Make sure Category records also exist for Diesel Big Daddy
  const existingCat = await prisma.category.findFirst({ where: { name: 'Diesel Big Daddy' } });
  if (!existingCat) {
    await prisma.category.create({
      data: {
        name: 'Diesel Big Daddy',
        slug: 'diesel-big-daddy'
      }
    });
  }

  // Print final verification
  const all = await prisma.product.findMany({ select: { brand: true, price: true } });
  const byBrand: Record<string, number[]> = {};
  for (const p of all) {
    if (!byBrand[p.brand]) byBrand[p.brand] = [];
    byBrand[p.brand].push(p.price);
  }

  console.log('\n=== FINAL VERIFIED DATABASE PRICES ===');
  for (const [b, prices] of Object.entries(byBrand).sort()) {
    console.log(`${b}: Count = ${prices.length}, Price = ₹${[...new Set(prices)].join(', ')}`);
  }
}

applyFinalPrices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
