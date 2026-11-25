import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const timeZone: any[] = await prisma.$queryRaw`SHOW TimeZone`;
  console.log('TimeZone:', timeZone);

  // Let's check inet_server_addr
  const serverAddr: any[] = await prisma.$queryRaw`SELECT inet_server_addr(), inet_server_port()`;
  console.log('Server Addr:', serverAddr);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
