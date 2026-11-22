import { NextRequest, NextResponse } from "next/server";
import { createYoupiOrder } from "@/lib/youpi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      amount,
      customerName,
      customerPhone,
      customerEmail,
      paymentType,
    } = body;

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
    const returnUrl = `${protocol}://${host}/cart?order_id=${encodeURIComponent(orderId)}`;

    const orderRes = await createYoupiOrder({
      orderId,
      orderAmount: amount,
      customerName: customerName || "Customer",
      customerPhone: customerPhone || "7702049015",
      customerEmail: customerEmail || "customer@dappersfit.com",
      returnUrl,
      paymentType: paymentType === "cod_advance" ? "cod_advance" : "prepaid",
    });

    return NextResponse.json(orderRes);
  } catch (error: unknown) {
    console.error("Error creating YouPI-PG order:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
