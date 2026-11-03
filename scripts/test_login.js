const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admindappersfit@gmail.com' },
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  const isValid = verifyPassword('Admin@1234', user.passwordHash);
  console.log(`Login check for ${user.email} (Role: ${user.role}):`, isValid ? 'SUCCESS!' : 'FAILED');
}

main().finally(() => prisma.$disconnect());
