import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, RAZORPAY_KEY_ID, isDemoMode } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, receipt } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount provided." },
        { status: 400 }
      );
    }

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);
    const orderReceipt = receipt || `rcpt_${Date.now()}`;

    const client = getRazorpayClient();

    if (client && !isDemoMode()) {
      try {
        const order = await client.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: orderReceipt,
          payment_capture: true,
          notes: {
            store: "Dappersfit Luxury Watches",
          },
        });

        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: RAZORPAY_KEY_ID,
          isDemo: false,
        });
      } catch (err: any) {
        console.warn("Razorpay API order creation error, falling back to sandbox demo mode:", err?.message || err);
      }
    }

    // Fallback sandbox / demo order for seamless testing without blocking KYC/keys
    const mockOrderId = `order_demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
      isDemo: true,
    });
  } catch (error: any) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order." },
      { status: 500 }
    );
  }
}
