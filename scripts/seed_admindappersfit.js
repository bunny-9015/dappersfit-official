const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lokesh = await prisma.user.findUnique({
    where: { email: 'adminlikesh@gmail.com' },
  });

  const existing = await prisma.user.findUnique({
    where: { email: 'admindappersfit@gmail.com' },
  });

  if (!existing && lokesh) {
    const user = await prisma.user.create({
      data: {
        name: 'DappersFit Admin',
        email: 'admindappersfit@gmail.com',
        passwordHash: lokesh.passwordHash, // Use same password the user set
        role: 'ADMIN',
        phone: lokesh.phone,
        city: lokesh.city,
      },
    });
    console.log('Created admindappersfit@gmail.com as ADMIN:', user.email);
  } else if (existing) {
    console.log('admindappersfit@gmail.com already exists:', existing.role);
  }
}

main().finally(() => prisma.$disconnect());
