import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeOrder } from "@/lib/cashfree";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderNumber } = body;

    const lookupId = orderId || orderNumber;

    if (!lookupId) {
      return NextResponse.json(
        { success: false, error: "Order ID or order number is required for verification." },
        { status: 400 }
      );
    }

    const verification = await verifyCashfreeOrder(lookupId);

    if (!verification.success || !verification.isPaid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Payment verification failed. Order is not paid.",
          orderStatus: verification.orderStatus,
        },
        { status: 400 }
      );
    }

    // Update database order status
    const targetOrderNumber = orderNumber || orderId;
    try {
      await prisma.order.update({
        where: { orderNumber: targetOrderNumber },
        data: {
          paymentStatus: "paid",
          orderStatus: "Confirmed",
          paymentMethod: "cashfree",
          notes: `Cashfree Payment Verified | Reference ID: ${verification.paymentId || lookupId}`,
        },
      });
    } catch (dbErr) {
      console.warn("Could not update order in DB during Cashfree verification:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Cashfree payment successfully verified.",
      orderStatus: "PAID",
      paymentId: verification.paymentId || lookupId,
    });
  } catch (error: any) {
    console.error("Error in Cashfree verification endpoint:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
