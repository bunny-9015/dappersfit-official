import { NextRequest, NextResponse } from "next/server";
import { verifyYoupiOrder } from "@/lib/youpi";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, orderId, orderNumber, utr, isDirectConfirmed } = body;

    const lookupId = paymentId || orderId || orderNumber;

    if (!lookupId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment ID or Order ID is required for verification.",
        },
        { status: 400 }
      );
    }

    const verification = await verifyYoupiOrder(lookupId, {
      utr,
      isDirectConfirmed: Boolean(isDirectConfirmed),
    });

    if (!verification.success || !verification.isPaid) {
      return NextResponse.json(
        {
          success: false,
          isPaid: false,
          error:
            verification.error ||
            "Payment was cancelled or not completed. Please try again.",
          orderStatus: verification.orderStatus,
        },
        { status: 400 }
      );
    }

    const targetOrderNumber = orderNumber || orderId;
    if (targetOrderNumber) {
      try {
        const existing = await prisma.order.findUnique({
          where: { orderNumber: targetOrderNumber },
        });
        if (existing) {
          await prisma.order.update({
            where: { orderNumber: targetOrderNumber },
            data: {
              paymentStatus: "paid",
              orderStatus: "Confirmed",
              notes: `YouPI-PG UPI Verified | Session: ${verification.paymentId}${
                verification.utr ? ` | UTR: ${verification.utr}` : ""
              }`,
            },
          });
        }
      } catch (dbErr) {
        console.warn("Could not update order in DB during YouPI verification:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      isPaid: true,
      message: "YouPI-PG payment successfully verified.",
      orderStatus: "PAID",
      paymentId: verification.paymentId,
      utr: verification.utr,
    });
  } catch (error: unknown) {
    console.error("Error in YouPI-PG verification endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
