import crypto from "crypto";

/**
 * YouPI-PG V2 Self-Hosted Direct UPI Payment Gateway Integration
 * Configured for DAPPERSFIT (VPA: pinelabs.stq4525474@pineaxis)
 */

export const YOUPI_API_URL =
  process.env.YOUPI_API_URL ||
  process.env.NEXT_PUBLIC_YOUPI_API_URL ||
  "http://localhost:6100";

export const YOUPI_CHECKOUT_URL =
  process.env.YOUPI_CHECKOUT_URL ||
  process.env.NEXT_PUBLIC_YOUPI_CHECKOUT_URL ||
  "http://localhost:7000";

export const YOUPI_MERCHANT_ID =
  process.env.YOUPI_MERCHANT_ID || "00000000-0000-0000-0000-000000000001";

export const YOUPI_MERCHANT_KEY =
  process.env.YOUPI_MERCHANT_API_KEY ||
  process.env.YOUPI_WEBHOOK_SECRET ||
  "aa9338a6e5b5adc179063ec1ac1f902203ab9d1bcd8c5ef456603241ff40e972";

export const YOUPI_WEBHOOK_SECRET =
  process.env.YOUPI_WEBHOOK_SECRET ||
  "aa9338a6e5b5adc179063ec1ac1f902203ab9d1bcd8c5ef456603241ff40e972";

export const YOUPI_PAYEE_VPA =
  process.env.YOUPI_PAYEE_VPA || "pinelabs.stq4525474@pineaxis";

export const YOUPI_PAYEE_NAME =
  process.env.YOUPI_PAYEE_NAME || "DAPPERSFIT";

export const YOUPI_SUPPORT_PHONE =
  process.env.YOUPI_SUPPORT_PHONE || "7702049015";

export interface CreateYoupiOrderParams {
  orderId: string;
  orderAmount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  returnUrl?: string;
  paymentType?: "prepaid" | "cod_advance";
}

export interface YoupiOrderResponse {
  success: boolean;
  orderId: string;
  paymentId: string;
  checkoutUrl: string;
  portalUrl: string;
  orderAmount: number;
  currency: string;
  payeeVpa: string;
  payeeName: string;
  upiUri: string;
  isFallbackModal: boolean;
  error?: string;
}

export function buildDirectUpiUri(params: {
  orderId: string;
  amount: number;
  payeeVpa?: string;
  payeeName?: string;
}): string {
  const vpa = params.payeeVpa || YOUPI_PAYEE_VPA;
  const name = params.payeeName || YOUPI_PAYEE_NAME;
  const amt = Number(params.amount).toFixed(2);
  const tr = encodeURIComponent(params.orderId);
  const pn = encodeURIComponent(name);
  const tn = encodeURIComponent(`DAPPERSFIT Order ${params.orderId}`);
  return `upi://pay?pa=${vpa}&pn=${pn}&am=${amt}&cu=INR&tr=${tr}&tn=${tn}`;
}

/**
 * Creates a payment session on the YouPI-PG Payment API (:6100)
 */
export async function createYoupiOrder(
  params: CreateYoupiOrderParams
): Promise<YoupiOrderResponse> {
  const {
    orderId,
    orderAmount,
    customerName,
    customerPhone,
    customerEmail,
    returnUrl,
    paymentType = "prepaid",
  } = params;

  const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10) || "7702049015";
  const cleanEmail =
    customerEmail && customerEmail.includes("@")
      ? customerEmail
      : `customer.${cleanPhone}@dappersfit.com`;

  const upiUri = buildDirectUpiUri({
    orderId,
    amount: orderAmount,
  });

  try {
    const response = await fetch(`${YOUPI_API_URL}/api/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": YOUPI_MERCHANT_ID,
        "X-Merchant-Key": YOUPI_MERCHANT_KEY,
        "Idempotency-Key": `youpi_${orderId}_${Math.round(orderAmount * 100)}`,
      },
      body: JSON.stringify({
        orderId,
        amount: Number(orderAmount).toFixed(2),
        currency: "INR",
        method: "UPI",
        autoActivate: true,
        returnUrl: returnUrl || "http://localhost:3000/cart",
        customer: {
          fullName: customerName || "DappersFit Customer",
          phoneNumber: cleanPhone,
          mobileNumber: cleanPhone,
          email: cleanEmail,
        },
        metadata: {
          store: "DAPPERSFIT",
          paymentType,
          customerName,
          customerPhone: cleanPhone,
        },
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.paymentId) {
      console.warn("YouPI-PG API returned non-200, activating direct YouPI QR modal:", data);
      const fallbackId = `youpi_direct_${Date.now()}`;
      return {
        success: true,
        orderId,
        paymentId: fallbackId,
        checkoutUrl: `${YOUPI_CHECKOUT_URL}/checkout/${fallbackId}`,
        portalUrl: YOUPI_CHECKOUT_URL,
        orderAmount,
        currency: "INR",
        payeeVpa: YOUPI_PAYEE_VPA,
        payeeName: YOUPI_PAYEE_NAME,
        upiUri,
        isFallbackModal: true,
      };
    }

    return {
      success: true,
      orderId: data.orderId || orderId,
      paymentId: data.paymentId,
      checkoutUrl:
        data.checkoutUrl || `${YOUPI_CHECKOUT_URL}/checkout/${data.paymentId}`,
      portalUrl: YOUPI_CHECKOUT_URL,
      orderAmount,
      currency: data.currency || "INR",
      payeeVpa: YOUPI_PAYEE_VPA,
      payeeName: YOUPI_PAYEE_NAME,
      upiUri,
      isFallbackModal: false,
    };
  } catch (err: unknown) {
    console.warn("YouPI-PG service unreachable on :6100, using direct YouPI VPA modal:", err);
    const fallbackId = `youpi_direct_${Date.now()}`;
    return {
      success: true,
      orderId,
      paymentId: fallbackId,
      checkoutUrl: `${YOUPI_CHECKOUT_URL}/checkout/${fallbackId}`,
      portalUrl: YOUPI_CHECKOUT_URL,
      orderAmount,
      currency: "INR",
      payeeVpa: YOUPI_PAYEE_VPA,
      payeeName: YOUPI_PAYEE_NAME,
      upiUri,
      isFallbackModal: true,
    };
  }
}

/**
 * Verifies a YouPI-PG payment session status from the Payment API (:6100)
 */
export async function verifyYoupiOrder(
  paymentId: string,
  options?: {
    utr?: string;
    isDirectConfirmed?: boolean;
  }
): Promise<{
  success: boolean;
  orderStatus: string;
  isPaid: boolean;
  paymentId: string;
  utr?: string;
  error?: string;
}> {
  if (paymentId.startsWith("youpi_direct_")) {
    if (options?.isDirectConfirmed && options?.utr && options.utr.trim().length >= 6) {
      return {
        success: true,
        orderStatus: "PAID",
        isPaid: true,
        paymentId,
        utr: options.utr.trim(),
      };
    }
    return {
      success: false,
      orderStatus: "CANCELLED",
      isPaid: false,
      paymentId,
      error: "Payment was cancelled or UTR was not provided.",
    };
  }

  try {
    const res = await fetch(`${YOUPI_API_URL}/api/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: {
        "X-Merchant-Id": YOUPI_MERCHANT_ID,
        "X-Merchant-Key": YOUPI_MERCHANT_KEY,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        success: false,
        orderStatus: "UNKNOWN",
        isPaid: false,
        paymentId,
        error: "Could not verify payment session from YouPI-PG.",
      };
    }

    const data = await res.json();
    const status = String(data.status || "").toUpperCase();
    const internalStatus = String(data.internalStatus || status).toUpperCase();

    const paidStatuses = new Set([
      "SUCCESS",
      "OBSERVED_SUCCESS",
      "RECONCILED",
      "MANUAL_REVIEW",
      "PROCESSING",
    ]);

    const isPaid =
      paidStatuses.has(status) ||
      paidStatuses.has(internalStatus) ||
      (Boolean(options?.isDirectConfirmed) &&
        status !== "CANCELLED" &&
        status !== "FAILED" &&
        status !== "EXPIRED");

    return {
      success: isPaid,
      orderStatus: isPaid ? "PAID" : status || "PENDING",
      isPaid,
      paymentId: data.paymentId || paymentId,
      utr: options?.utr || data.utr || undefined,
      error: isPaid
        ? undefined
        : "Payment was cancelled or not completed. Your cart items are safe — please retry payment.",
    };
  } catch (err: unknown) {
    console.error("YouPI-PG verification error:", err);
    return {
      success: false,
      orderStatus: "ERROR",
      isPaid: false,
      paymentId,
      error: err instanceof Error ? err.message : "Failed to verify YouPI-PG payment.",
    };
  }
}

/**
 * Verifies incoming HMAC-SHA256 webhook signature from YouPI-PG
 */
export function verifyYoupiWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader?: string | null
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const actualHex = signatureHeader.slice("sha256=".length).trim();
  const expectedRawHex = crypto
    .createHmac("sha256", YOUPI_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  const safeCompare = (a: string, b: string) => {
    if (a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
    } catch {
      return false;
    }
  };

  if (safeCompare(actualHex, expectedRawHex)) {
    return true;
  }

  if (timestampHeader) {
    const expectedTsHex = crypto
      .createHmac("sha256", YOUPI_WEBHOOK_SECRET)
      .update(`${timestampHeader}.${rawBody}`, "utf8")
      .digest("hex");
    if (safeCompare(actualHex, expectedTsHex)) {
      return true;
    }
  }

  return false;
}
