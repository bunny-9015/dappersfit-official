import * as fs from 'fs';
import * as path from 'path';

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function escapeSqlDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'NULL';
  return `'${new Date(dateStr).toISOString()}'`;
}

function generateSql() {
  const seedPath = path.join(process.cwd(), 'prisma', 'supabase_seed_data.json');
  const data = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  let sql = `-- ==============================================================================
-- DAPPERSFIT LUXURY TIMEPIECES - PRODUCTION SUPABASE POSTGRESQL SCHEMA & SEED
-- Generated automatically for cloud deployment
-- Total Categories: ${data.categories.length}
-- Total Products: ${data.products.length} (Including all 45 Rolex models @ ₹2,499)
-- Total Users: ${data.users.length}
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (clean cascade)
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "WatchRequest" CASCADE;
DROP TABLE IF EXISTS "Waitlist" CASCADE;

-- ==========================================
-- 1. TABLE DEFINITIONS
-- ==========================================

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "expectedDeliveryDate" TIMESTAMP(3),
    "preBookingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "shippingAddress" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cod',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "orderStatus" TEXT NOT NULL DEFAULT 'Pending',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promoCode" TEXT,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingMethod" TEXT NOT NULL DEFAULT 'standard',
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WatchRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "email" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "productUrl" TEXT,
    "budgetRange" TEXT,
    "condition" TEXT,
    "timeline" TEXT,
    "specialRequirements" TEXT,
    "preferredColor" TEXT,
    "dialColor" TEXT,
    "strapPreference" TEXT,
    "materialPreference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New Request',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "requestedProduct" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- ==========================================
-- 2. SEED DATA: CATEGORIES (${data.categories.length})
-- ==========================================
`;

  for (const c of data.categories) {
    sql += `INSERT INTO "Category" ("id", "name", "slug") VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}) ON CONFLICT ("id") DO NOTHING;\n`;
  }

  sql += `\n-- ==========================================\n-- 3. SEED DATA: USERS (${data.users.length})\n-- ==========================================\n`;
  for (const u of data.users) {
    sql += `INSERT INTO "User" ("id", "name", "email", "passwordHash", "phone", "role", "address", "city", "state", "pincode", "createdAt", "updatedAt") VALUES (${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.email)}, ${escapeSql(u.passwordHash)}, ${escapeSql(u.phone)}, ${escapeSql(u.role)}, ${escapeSql(u.address)}, ${escapeSql(u.city)}, ${escapeSql(u.state)}, ${escapeSql(u.pincode)}, ${escapeSqlDate(u.createdAt)}, ${escapeSqlDate(u.updatedAt)}) ON CONFLICT ("id") DO NOTHING;\n`;
  }

  sql += `\n-- ==========================================\n-- 4. SEED DATA: PRODUCTS (${data.products.length})\n-- ==========================================\n`;
  for (const p of data.products) {
    sql += `INSERT INTO "Product" ("id", "name", "brand", "price", "description", "imageUrl", "inStock", "quantity", "expectedDeliveryDate", "preBookingAvailable", "createdAt", "updatedAt", "categoryId") VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.brand)}, ${p.price}, ${escapeSql(p.description)}, ${escapeSql(p.imageUrl)}, ${p.inStock}, ${p.quantity}, ${escapeSqlDate(p.expectedDeliveryDate)}, ${p.preBookingAvailable}, ${escapeSqlDate(p.createdAt)}, ${escapeSqlDate(p.updatedAt)}, ${escapeSql(p.categoryId)}) ON CONFLICT ("id") DO NOTHING;\n`;
  }

  const outPath = path.join(process.cwd(), 'prisma', 'supabase_full_dump.sql');
  fs.writeFileSync(outPath, sql, 'utf-8');
  console.log(`✅ Generated comprehensive SQL file at: ${outPath}`);
  console.log(`- File size: ${(Buffer.byteLength(sql) / 1024).toFixed(2)} KB`);
}

generateSql();
