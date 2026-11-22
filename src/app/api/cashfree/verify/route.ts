import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeOrder } from "@/lib/cashfree";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderNumber, isSimulatedSuccess, simulatedMode } = body;

    const lookupId = orderId || orderNumber;

    if (!lookupId) {
      return NextResponse.json(
        { success: false, error: "Order ID or order number is required for verification." },
        { status: 400 }
      );
    }

    const verification = await verifyCashfreeOrder(lookupId, {
      isSimulatedSuccess: Boolean(isSimulatedSuccess),
      simulatedMode,
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

    // Update database order status if the order already exists in DB
    const targetOrderNumber = orderNumber || orderId;
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
            paymentMethod: "cashfree",
            notes: `Cashfree Payment Verified | Reference ID: ${verification.paymentId || lookupId}`,
          },
        });
      }
    } catch (dbErr) {
      console.warn("Could not update order in DB during Cashfree verification:", dbErr);
    }

    return NextResponse.json({
      success: true,
      isPaid: true,
      message: "Cashfree payment successfully verified.",
      orderStatus: "PAID",
      paymentId: verification.paymentId || lookupId,
    });
  } catch (error: unknown) {
    console.error("Error in Cashfree verification endpoint:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
