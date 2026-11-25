import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { YOUPI_API_URL, YOUPI_API_KEY, confirmYoupiPayment } from "@/lib/youpi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderNumber, utr } = body || {};

    const targetOrderNumber = String(orderNumber || orderId || "").trim();
    if (!targetOrderNumber) {
      return NextResponse.json(
        { success: false, error: "Order number is required for verification." },
        { status: 400 }
      );
    }

    const cleanUtr = String(utr || "").trim();
    const hasUtr = cleanUtr.length > 0;

    // Validate 12-digit format if customer submitted a UTR
    if (hasUtr && !/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        { success: false, error: "UPI Reference / UTR must be exactly 12 numeric digits." },
        { status: 400 }
      );
    }

    // 1. Check if order in database is already marked paid by YouPI background webhook
    let dbOrder: any = null;
    try {
      dbOrder = await prisma.order.findUnique({
        where: { orderNumber: targetOrderNumber },
      });
    } catch {
      // Non-blocking
    }

    if (dbOrder && (dbOrder.paymentStatus === "paid" || dbOrder.orderStatus === "Confirmed")) {
      return NextResponse.json({
        success: true,
        isPaid: true,
        orderStatus: "PAID",
        paymentId: dbOrder.notes || "youpi_verified",
        orderNumber: targetOrderNumber,
      });
    }

    // 2. If customer entered and submitted their 12-digit UTR: verify and confirm order
    if (hasUtr) {
      const verificationRef = cleanUtr;
      try {
        await prisma.order.update({
          where: { orderNumber: targetOrderNumber },
          data: {
            paymentStatus: "paid",
            orderStatus: "Confirmed",
            paymentMethod: "youpi_upi",
            notes: `YouPI UPI Verified | UTR: ${verificationRef}`,
          },
        });
      } catch (dbErr) {
        console.warn("Could not update order in DB during YouPI verification:", dbErr);
      }

      // Sync confirmed state to YouPI-PG daemon so Merchant Dashboard updates
      await confirmYoupiPayment(targetOrderNumber, `Verified with UTR: ${verificationRef}`);

      return NextResponse.json({
        success: true,
        message: "YouPI payment successfully verified with UTR.",
        orderStatus: "PAID",
        isPaid: true,
        paymentId: verificationRef,
        orderNumber: targetOrderNumber,
      });
    }

    // 3. Check YouPI daemon session status if available
    try {
      const daemonRes = await fetch(`${YOUPI_API_URL}/api/v1/sessions/${encodeURIComponent(targetOrderNumber)}`, {
        headers: { "x-api-key": YOUPI_API_KEY },
      });
      if (daemonRes.ok) {
        const daemonData = await daemonRes.json();
        if (daemonData.status === "completed" || daemonData.status === "reconciled") {
          return NextResponse.json({
            success: true,
            isPaid: true,
            orderStatus: "PAID",
            paymentId: daemonData.utr || "youpi_daemon",
            orderNumber: targetOrderNumber,
          });
        }
      }
    } catch {
      // Non-blocking
    }

    // 4. Default: Still pending payment — scanner MUST stay open
    return NextResponse.json({
      success: true,
      isPaid: false,
      orderStatus: "PENDING",
      message: "Awaiting customer payment.",
    });
  } catch (error: any) {
    console.error("Error in YouPI verification endpoint:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
