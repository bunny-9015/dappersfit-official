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
    where: { email: 'adminlikesh@gmail.com' },
  });
  const candidates = ['Admin@1234', '123456', 'Admin123', 'admin', 'lokesh', 'dappersfit', 'password', '12345678'];
  for (const c of candidates) {
    if (verifyPassword(c, user.passwordHash)) {
      console.log('Password is:', c);
      return;
    }
  }
  console.log('None of the candidates matched.');
}

main().finally(() => prisma.$disconnect());
