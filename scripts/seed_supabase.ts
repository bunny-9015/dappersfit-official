import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedSupabase() {
  const seedPath = path.join(process.cwd(), 'prisma', 'supabase_seed_data.json');
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed data file not found at ${seedPath}`);
  }

  const raw = fs.readFileSync(seedPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log(`🚀 Starting migration to Supabase PostgreSQL...`);
  console.log(`- Categories to seed: ${data.categories.length}`);
  console.log(`- Products to seed: ${data.products.length}`);
  console.log(`- Users to seed: ${data.users.length}`);

  // 1. Seed Categories
  console.log('\n📁 Seeding Categories...');
  for (const cat of data.categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      },
    });
  }
  console.log(`✅ ${data.categories.length} Categories seeded.`);

  // 2. Seed Users
  console.log('\n👤 Seeding Users...');
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash: u.passwordHash,
        phone: u.phone,
        address: u.address,
        city: u.city,
        state: u.state,
        pincode: u.pincode,
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        phone: u.phone,
        address: u.address,
        city: u.city,
        state: u.state,
        pincode: u.pincode,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }
  console.log(`✅ ${data.users.length} Users seeded.`);

  // 3. Seed Products
  console.log('\n⌚ Seeding Products...');
  let seededProducts = 0;
  for (const p of data.products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        brand: p.brand,
        price: p.price,
        description: p.description,
        imageUrl: p.imageUrl,
        inStock: p.inStock,
        quantity: p.quantity,
        expectedDeliveryDate: p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate) : null,
        preBookingAvailable: p.preBookingAvailable,
        categoryId: p.categoryId,
      },
      create: {
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        description: p.description,
        imageUrl: p.imageUrl,
        inStock: p.inStock,
        quantity: p.quantity,
        expectedDeliveryDate: p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate) : null,
        preBookingAvailable: p.preBookingAvailable,
        categoryId: p.categoryId,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    seededProducts++;
  }
  console.log(`✅ ${seededProducts} Products successfully seeded into Supabase!`);

  console.log('\n🎉 ALL 152 WATCHES & DATA HAVE BEEN MIGRATED TO SUPABASE SUCCESSFULLY!');
}

seedSupabase()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
