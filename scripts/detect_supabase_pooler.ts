import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const timeZone = await prisma.$queryRaw<Array<Record<string, unknown>>>`SHOW TimeZone`;
  console.log('TimeZone:', timeZone);

  // Let's check inet_server_addr
  const serverAddr = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT inet_server_addr(), inet_server_port()`;
  console.log('Server Addr:', serverAddr);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
