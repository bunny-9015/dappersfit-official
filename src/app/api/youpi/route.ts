import { NextResponse } from "next/server";
import {
  YOUPI_API_URL,
  YOUPI_CHECKOUT_URL,
  YOUPI_MERCHANT_ID,
  YOUPI_PAYEE_NAME,
  YOUPI_PAYEE_VPA,
  YOUPI_SUPPORT_PHONE,
} from "@/lib/youpi";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    gateway: "YouPI-PG V2",
    merchantId: YOUPI_MERCHANT_ID,
    payeeName: YOUPI_PAYEE_NAME,
    payeeVpa: YOUPI_PAYEE_VPA,
    supportPhone: YOUPI_SUPPORT_PHONE,
    apiUrl: YOUPI_API_URL,
    checkoutUrl: YOUPI_CHECKOUT_URL,
    endpoints: {
      createOrder: "/api/youpi/create-order",
      verify: "/api/youpi/verify",
      webhook: "/api/youpi/webhook",
    },
  });
}
