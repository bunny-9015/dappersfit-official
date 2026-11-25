import { NextRequest, NextResponse } from "next/server";
import { verifyYoupiWebhook, YOUPI_WEBHOOK_SECRET } from "@/lib/youpi";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-youpi-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-youpi-signature-v2");

    const isValid = verifyYoupiWebhook(rawBody, signature, YOUPI_WEBHOOK_SECRET);
    if (!isValid) {
      console.warn("[YouPI Webhook] Invalid HMAC signature rejected.");
      return NextResponse.json(
        { success: false, error: "Invalid HMAC signature." },
        { status: 401 }
      );
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { event, orderId, utr, paymentId } = payload || {};
    const ref = utr || paymentId || `youpi_auto_${Date.now()}`;

    if (orderId && (event === "payment.succeeded" || event === "reconciled" || !event)) {
      try {
        await prisma.order.update({
          where: { orderNumber: orderId },
          data: {
            paymentStatus: "paid",
            orderStatus: "Confirmed",
            paymentMethod: "youpi_upi",
            notes: `YouPI Auto-Reconciled Webhook | Ref: ${ref}`,
          },
        });
      } catch (dbErr) {
        console.warn("[YouPI Webhook] DB order update skipped:", dbErr);
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error("[YouPI Webhook Error]:", err);
    return NextResponse.json(
      { success: false, error: "Internal processing error" },
      { status: 500 }
    );
  }
}
