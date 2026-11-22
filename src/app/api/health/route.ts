import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.product.count();
    dbLatency = Date.now() - dbStart;
  } catch (e: unknown) {
    dbStatus = "error: " + (e instanceof Error ? e.message : "DB unreachable");
  }

  const memory = process.memoryUsage();

  return NextResponse.json(
    {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      },
    },
    { status: 200 }
  );
}
