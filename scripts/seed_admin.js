const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const adminEmail = 'admin@dappersfit.com';
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const admin = await prisma.user.create({
      data: {
        name: 'DappersFit Admin',
        email: adminEmail,
        passwordHash: hashPassword('Admin@1234'),
        role: 'ADMIN',
        phone: '+91 98765 43210',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
    });
    console.log('Created default admin account:', admin.email);
  } else {
    console.log('Admin account already exists:', existing.email);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
