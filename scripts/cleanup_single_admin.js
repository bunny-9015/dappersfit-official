const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  // 1. Delete lokesh account
  const deleted = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'adminlikesh@gmail.com' },
        { name: { contains: 'lokesh' } },
      ],
    },
  });
  console.log('Deleted lokesh account count:', deleted.count);

  // 2. Update or create admindappersfit@gmail.com with password 'Admin@1234'
  const newHash = hashPassword('Admin@1234');
  const existing = await prisma.user.findUnique({
    where: { email: 'admindappersfit@gmail.com' },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: 'DappersFit Store Owner',
        passwordHash: newHash,
        role: 'ADMIN',
      },
    });
    console.log('Updated admindappersfit@gmail.com with master password.');
  } else {
    await prisma.user.create({
      data: {
        name: 'DappersFit Store Owner',
        email: 'admindappersfit@gmail.com',
        passwordHash: newHash,
        role: 'ADMIN',
      },
    });
    console.log('Created admindappersfit@gmail.com as master admin.');
  }

  // 3. Verify exactly what users exist now
  const users = await prisma.user.findMany();
  console.log('=== REMAINING ACTIVE DATABASE USERS ===');
  users.forEach((u) => {
    console.log(`- [${u.role}] Email: ${u.email} | Name: ${u.name}`);
  });
}

main().finally(() => prisma.$disconnect());
