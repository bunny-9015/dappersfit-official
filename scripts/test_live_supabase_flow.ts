import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runEndToEndTest() {
  console.log('🧪 Starting End-to-End Supabase PostgreSQL Test...');

  // 1. Fetch a random product from Supabase
  const product = await prisma.product.findFirst({
    where: { brand: 'Rolex' },
    include: { category: true }
  });

  if (!product) throw new Error('No Rolex product found in Supabase!');
  console.log(`✅ Retrieved Product from Supabase: ${product.name} (₹${product.price}) [Category: ${product.category.name}]`);

  // 2. Create a test order
  const testOrderNumber = `TEST-${Date.now()}`;
  const testOrder = await prisma.order.create({
    data: {
      orderNumber: testOrderNumber,
      customerName: 'Production Verification Bot',
      customerPhone: '9999999999',
      customerEmail: 'testbot@dappersfit.com',
      shippingAddress: '123 Luxury Road, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      paymentMethod: 'cashfree',
      paymentStatus: 'paid',
      orderStatus: 'Confirmed',
      subtotal: product.price,
      totalAmount: product.price,
      notes: 'Automated Supabase Verification Order',
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            brand: product.brand,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
          }
        ]
      }
    },
    include: {
      items: true
    }
  });

  console.log(`✅ Order successfully inserted into Supabase Cloud: ID ${testOrder.id}, Number ${testOrder.orderNumber}`);
  console.log(`✅ Order Item verified: ${testOrder.items[0].productName} x ${testOrder.items[0].quantity} (₹${testOrder.items[0].price})`);

  // 3. Query the order back
  const retrievedOrder = await prisma.order.findUnique({
    where: { orderNumber: testOrderNumber },
    include: { items: true }
  });

  if (!retrievedOrder) throw new Error('Failed to retrieve test order from Supabase!');
  console.log(`✅ Order verified and retrieved from Supabase Cloud PostgreSQL successfully!`);

  // 4. Clean up the test order so the database stays pure
  await prisma.orderItem.deleteMany({ where: { orderId: retrievedOrder.id } });
  await prisma.order.delete({ where: { id: retrievedOrder.id } });
  console.log(`✅ Test order cleaned up. Supabase remains clean and production-ready!`);

  console.log('\n🌟 SUPABASE CLOUD DATABASE FULL READ/WRITE LIFECYCLE 100% OPERATIONAL!');
}

runEndToEndTest()
  .catch((e) => {
    console.error('❌ E2E Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
