import { NextRequest, NextResponse } from "next/server";
import { verifyYoupiWebhookSignature, YOUPI_PAYEE_VPA, YOUPI_PAYEE_NAME } from "@/lib/youpi";
import prisma from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/youpi/webhook",
    method: "POST (HMAC-SHA256 Signed Webhook)",
    payeeName: YOUPI_PAYEE_NAME,
    payeeVpa: YOUPI_PAYEE_VPA,
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-gateway-signature") ||
      req.headers.get("x-gateway-signature-v2");
    const timestamp = req.headers.get("x-gateway-timestamp");

    if (!verifyYoupiWebhookSignature(rawBody, signature, timestamp)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = String(payload.event || "").toUpperCase();
    const orderId = String(payload.orderId || "").trim();
    const utr = String(payload.utr || "").trim();
    const paymentId = String(payload.paymentId || "").trim();

    if (
      orderId &&
      (event === "OBSERVED_SUCCESS" ||
        event === "RECONCILED" ||
        event === "SUCCESS")
    ) {
      try {
        const existing = await prisma.order.findUnique({
          where: { orderNumber: orderId },
        });
        if (existing) {
          await prisma.order.update({
            where: { orderNumber: orderId },
            data: {
              paymentStatus: "paid",
              orderStatus: "Confirmed",
              notes: `YouPI-PG Webhook (${event}) | Payment ID: ${paymentId}${
                utr ? ` | UTR: ${utr}` : ""
              }`,
            },
          });
        }
      } catch (dbErr) {
        console.warn("DB update skipped during YouPI webhook:", dbErr);
      }
    }

    return NextResponse.json({ received: true, event, orderId });
  } catch (error: unknown) {
    console.error("YouPI webhook processing error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
