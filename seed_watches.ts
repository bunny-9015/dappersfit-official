import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const watchesDir = path.join(process.cwd(), 'public', 'images');
  
  if (!fs.existsSync(watchesDir)) {
    console.log("Watches directory not found");
    return;
  }

  const brands = fs.readdirSync(watchesDir).filter(file => fs.statSync(path.join(watchesDir, file)).isDirectory());

  let totalAdded = 0;

  for (const brand of brands) {
    const cleanBrandName = brand.replace(/_/g, '').trim();
    
    // Create or find category
    const category = await prisma.category.upsert({
      where: { name: cleanBrandName },
      update: {},
      create: {
        name: cleanBrandName,
        slug: cleanBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }
    });

    const brandDir = path.join(watchesDir, brand);
    const images = fs.readdirSync(brandDir).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageUrl = `/images/${brand}/${image}`;
      
      // Random price between 500 and 50000 based on brand
      const priceMultiplier = cleanBrandName.toLowerCase().includes('rolex') || cleanBrandName.toLowerCase().includes('patek') || cleanBrandName.toLowerCase().includes('richard') ? 10000 : 500;
      const price = Math.floor(Math.random() * 50 + 10) * priceMultiplier;

      const productName = `${cleanBrandName} Model ${i + 1}`;

      await prisma.product.create({
        data: {
          name: productName,
          brand: cleanBrandName,
          price: price,
          description: `An exquisite luxury timepiece from ${cleanBrandName}.`,
          categoryId: category.id,
          inStock: true,
          quantity: Math.floor(Math.random() * 5) + 1,
          imageUrl: imageUrl
        }
      });
      totalAdded++;
    }
  }

  console.log(`Successfully added ${totalAdded} watches to the database!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
