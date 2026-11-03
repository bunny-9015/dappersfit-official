import prisma from '../src/lib/prisma';

async function main() {
  const diesel = await prisma.product.findMany({ where: { brand: 'Diesel' } });
  console.log(JSON.stringify(diesel.map(x => ({ id: x.id, name: x.name, imageUrl: x.imageUrl, price: x.price })), null, 2));
}

main().finally(() => prisma.$disconnect());
