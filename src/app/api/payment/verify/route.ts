import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/razorpay";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderNumber,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment parameters." },
        { status: 400 }
      );
    }

    const isValid = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // Update database order status if orderNumber was provided
    if (orderNumber) {
      try {
        await prisma.order.update({
          where: { orderNumber },
          data: {
            paymentStatus: "paid",
            orderStatus: "Confirmed",
            paymentMethod: "razorpay",
            notes: `Razorpay Payment ID: ${razorpay_payment_id} | Order ID: ${razorpay_order_id}`,
          },
        });
      } catch (dbErr) {
        console.warn("Could not update order in DB during payment verification:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error: any) {
    console.error("Error verifying payment signature:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
