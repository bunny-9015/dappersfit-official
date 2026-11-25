import { NextRequest, NextResponse } from "next/server";
import { createCashfreeOrder, isCashfreeDemoMode, CASHFREE_ENV } from "@/lib/cashfree";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName, customerPhone, customerEmail } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const returnUrl = `${protocol}://${host}/cart?order_id=${orderId}`;

    const orderRes = await createCashfreeOrder({
      orderId,
      orderAmount: amount,
      customerName: customerName || "Customer",
      customerPhone: customerPhone || "9999999999",
      customerEmail: customerEmail || "customer@dappersfit.com",
      returnUrl,
    });

    return NextResponse.json({
      ...orderRes,
      env: CASHFREE_ENV,
      isDemo: isCashfreeDemoMode() || orderRes.isDemo,
    });
  } catch (error: any) {
    console.error("Error creating Cashfree order:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
