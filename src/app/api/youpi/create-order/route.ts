import { NextRequest, NextResponse } from "next/server";
import { createYoupiSession, YOUPI_VPA, YOUPI_PAYEE_NAME } from "@/lib/youpi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName, customerPhone, customerEmail, metadata } = body || {};

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order identifier is required." },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const returnUrl = `${protocol}://${host}/cart?order_id=${encodeURIComponent(orderId)}`;

    const session = await createYoupiSession({
      orderId,
      amount,
      customerName,
      customerPhone,
      customerEmail,
      returnUrl,
      metadata: metadata && typeof metadata === "object" ? metadata : undefined,
    });

    return NextResponse.json({
      ...session,
      payeeVpa: YOUPI_VPA,
      payeeName: YOUPI_PAYEE_NAME,
    });
  } catch (error: any) {
    console.error("Error creating YouPI session:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
