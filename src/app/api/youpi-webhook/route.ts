import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { YOUPI_WEBHOOK_SECRET, verifyYoupiWebhook } from "@/lib/youpi";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-gateway-signature") ||
      req.headers.get("x-youpi-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-youpi-signature-v2");

    const isValid = verifyYoupiWebhook(rawBody, signature, YOUPI_WEBHOOK_SECRET);
    if (!isValid) {
      console.warn("[YouPI Webhook] Signature mismatch / unauthorized callback rejected.");
      return NextResponse.json({ error: "Signature mismatch" }, { status: 401 });
    }

    let eventData: any = {};
    try {
      eventData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { event, orderId, amount, utr, paymentId } = eventData || {};
    const ref = utr || paymentId || "youpi_webhook_verified";

    const normalizedEvent = String(event || "").toUpperCase();
    if (
      orderId &&
      (!normalizedEvent ||
        normalizedEvent === "SUCCESS" ||
        normalizedEvent === "OBSERVED_SUCCESS" ||
        normalizedEvent === "RECONCILED" ||
        normalizedEvent === "PAYMENT.SUCCEEDED")
    ) {
      try {
        const cleanOrderId = String(orderId).trim();
        const existing = await prisma.order.findUnique({
          where: { orderNumber: cleanOrderId },
        });
        const paidNum = Number(amount || 0);
        const isCodAdvance =
          existing?.paymentMethod === "cod_advance" ||
          (existing && paidNum > 0 && paidNum < existing.totalAmount);
        const balanceDue = existing
          ? Math.max(0, existing.totalAmount - (paidNum || 300))
          : 0;

        await prisma.order.update({
          where: { orderNumber: cleanOrderId },
          data: {
            paymentStatus: isCodAdvance ? "partial_paid" : "paid",
            orderStatus: "Confirmed",
            paymentMethod: isCodAdvance ? "cod_advance" : "youpi_upi",
            notes: isCodAdvance
              ? `COD Advance ₹${paidNum || 300} Paid via YouPI | Balance ₹${balanceDue} on delivery | Ref: ${ref}`
              : `YouPI Authoritative Webhook | Ref: ${ref} | Amount: ${amount || ""}`,
          },
        });
      } catch (err) {
        console.warn("[YouPI Webhook] Order update skipped in DB:", err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[YouPI Webhook Error]:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
