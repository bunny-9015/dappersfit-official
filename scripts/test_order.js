const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.order.count();
  console.log('Current order count:', count);

  if (count === 0) {
    console.log('Seeding demo order...');
    const demoOrder = await prisma.order.create({
      data: {
        orderNumber: 'DF-ORD-882190',
        customerName: 'Rahul Sharma',
        customerPhone: '+91 98201 54321',
        customerEmail: 'rahul.sharma@example.com',
        shippingAddress: 'Flat 402, Royal Palms, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        orderStatus: 'Pending',
        subtotal: 7998,
        discountAmount: 500,
        promoCode: 'FLAT500',
        shippingCost: 0,
        shippingMethod: 'express',
        taxAmount: 0,
        totalAmount: 7498,
        items: {
          create: [
            {
              productName: 'Carrera Chronograph Blue Dial',
              brand: 'Carrera',
              price: 3999,
              quantity: 1,
              imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
            },
            {
              productName: 'Big Daddy Grand Dial Leather',
              brand: 'Diesel big daddy',
              price: 3999,
              quantity: 1,
              imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });
    console.log('Created sample order:', demoOrder.orderNumber);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
