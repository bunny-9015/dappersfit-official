import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "test-demo" },
    update: { name: "UPI Verification Test" },
    create: {
      name: "UPI Verification Test",
      slug: "test-demo",
    },
  });

  const product = await prisma.product.upsert({
    where: { id: "test-upi-1rupee" },
    update: {
      name: "₹1 UPI Payment Test Token",
      brand: "Dappersfit Demo",
      price: 1,
      description: "Test product for live ₹1 UPI QR scanning & verification with Pine Labs.",
      inStock: true,
      quantity: 999,
      categoryId: category.id,
      imageUrl: "/logo.png",
    },
    create: {
      id: "test-upi-1rupee",
      name: "₹1 UPI Payment Test Token",
      brand: "Dappersfit Demo",
      price: 1,
      description: "Test product for live ₹1 UPI QR scanning & verification with Pine Labs.",
      inStock: true,
      quantity: 999,
      categoryId: category.id,
      imageUrl: "/logo.png",
    },
  });

  console.log("Successfully seeded ₹1 test product:", product.name, "Price: ₹" + product.price);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
