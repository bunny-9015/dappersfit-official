/**
 * YouPI-PG Gateway Integration for DappersFit Luxury Watches
 * Self-hosted UPI Payment Gateway with zero aggregator KYC lockouts
 */

import crypto from "crypto";

export const YOUPI_API_URL =
  process.env.YOUPI_API_URL || "https://pay-api.dappersfit.com";
export const YOUPI_PORTAL_URL =
  process.env.YOUPI_PORTAL_URL || "https://pay.dappersfit.com";
export const YOUPI_MERCHANT_ID =
  process.env.YOUPI_MERCHANT_ID || "d99d66ee-1530-4c38-9872-69ecec0102a7";
export const YOUPI_API_KEY =
  process.env.YOUPI_API_KEY || "yp_live_03a352119d6c1e3384b93a7403c1f23c";
export const YOUPI_ADMIN_TOKEN =
  process.env.YOUPI_ADMIN_TOKEN || "42c8c6b68100cc4d92e1579e3c3526cd4dda8b581d59ffd9f10a185adc3af288";
export const YOUPI_WEBHOOK_SECRET =
  process.env.YOUPI_WEBHOOK_SECRET || "45c8be24f481af99eaf98e58a87831f765d033d5c33e6d3e21629074db536aec";
export const YOUPI_VPA =
  process.env.YOUPI_VPA || "kamathamlokesh9015@dbs";
export const YOUPI_PAYEE_NAME =
  process.env.YOUPI_PAYEE_NAME || "Dappersfit";

export interface CreateYoupiSessionParams {
  orderId: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface YoupiSessionResponse {
  success: boolean;
  orderId: string;
  sessionId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  upiUri: string;
  qrPayload: string;
  payeeVpa: string;
  payeeName: string;
  checkoutUrl?: string;
  isSimulator?: boolean;
  error?: string;
}

/**
 * Builds a compliant NPCI UPI payment deep-link URI.
 */
export function buildUpiUri(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  orderId: string;
}): string {
  const { vpa, payeeName, amount, orderId } = params;
  const note = encodeURIComponent(`Order ${orderId}`);
  const pn = encodeURIComponent(payeeName);
  return `upi://pay?pa=${vpa}&pn=${pn}&am=${amount.toFixed(2)}&tr=${orderId}&tn=${note}&cu=INR`;
}

/**
 * Creates a YouPI payment session via the self-hosted YouPI API.
 * Falls back to direct dynamic UPI intent if the local daemon is unreachable.
 */
export async function createYoupiSession(
  params: CreateYoupiSessionParams
): Promise<YoupiSessionResponse> {
  const { orderId, amount, customerName, customerPhone, customerEmail, returnUrl, metadata } = params;
  const upiUri = buildUpiUri({
    vpa: YOUPI_VPA,
    payeeName: YOUPI_PAYEE_NAME,
    amount,
    orderId,
  });

  try {
    const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, "").slice(-10) : undefined;
    const payload = {
      orderId,
      amount: amount.toFixed(2),
      currency: "INR",
      customer: {
        name: customerName || "Customer",
        mobileNumber: cleanPhone,
        phoneNumber: cleanPhone,
        email: customerEmail || undefined,
      },
      customerName: customerName || "Customer",
      customerPhone: cleanPhone,
      customerEmail: customerEmail || undefined,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.dappersfit.com"}/cart?order_id=${orderId}`,
      metadata: metadata || undefined,
    };

    const res = await fetch(`${YOUPI_API_URL}/api/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": YOUPI_MERCHANT_ID,
        "X-Merchant-Key": YOUPI_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const pid = data.id || data.paymentId || data.sessionId;
      return {
        success: true,
        orderId,
        sessionId: pid,
        paymentId: pid,
        amount,
        currency: "INR",
        upiUri: data.upiUri || data.intentUrl || upiUri,
        qrPayload: data.qrPayload || data.upiUri || upiUri,
        payeeVpa: data.vpa || YOUPI_VPA,
        payeeName: data.payeeName || YOUPI_PAYEE_NAME,
        checkoutUrl: data.checkoutUrl,
        isSimulator: false,
      };
    }
  } catch (err) {
    // Graceful fallback to direct UPI QR intent
  }

  const localId = `youpi_local_${Date.now()}`;
  return {
    success: true,
    orderId,
    sessionId: localId,
    paymentId: localId,
    amount,
    currency: "INR",
    upiUri,
    qrPayload: upiUri,
    payeeVpa: YOUPI_VPA,
    payeeName: YOUPI_PAYEE_NAME,
    isSimulator: true,
  };
}

/**
 * Reconciles/confirms payment in YouPI-PG's database so merchant dashboard metrics update in real-time.
 */
export async function confirmYoupiPayment(
  paymentIdOrOrderId: string,
  notes = "Confirmed by customer UTR"
): Promise<boolean> {
  try {
    let targetSessionId = paymentIdOrOrderId;

    // If given an order ID (e.g. DF-123456), look up its session ID in YouPI
    if (targetSessionId.startsWith("DF-") || targetSessionId.startsWith("ORDER-")) {
      const listRes = await fetch(
        `${YOUPI_API_URL}/api/v1/admin/payments?merchantId=${YOUPI_MERCHANT_ID}`,
        {
          headers: { Authorization: `Bearer ${YOUPI_ADMIN_TOKEN}` },
        }
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        const found = (listData.payments || []).find(
          (p: any) => p.orderId === targetSessionId
        );
        if (found) targetSessionId = found.id;
      }
    }

    const confirmRes = await fetch(
      `${YOUPI_API_URL}/api/v1/admin/payments/${encodeURIComponent(targetSessionId)}/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${YOUPI_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ notes }),
      }
    );

    return confirmRes.ok;
  } catch (err) {
    console.warn("[YouPI Sync] Could not sync payment confirmation with YouPI daemon:", err);
    return false;
  }
}

/**
 * Timing-safe HMAC-SHA256 signature verification for YouPI webhooks.
 */
export function verifyYoupiWebhook(
  rawBody: string,
  signatureHeader?: string | null,
  secret = YOUPI_WEBHOOK_SECRET
): boolean {
  if (!signatureHeader || !secret) return false;

  try {
    const cleanSig = signatureHeader.replace(/^sha256=/, "").trim().toLowerCase();
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex")
      .toLowerCase();

    if (cleanSig.length !== expectedSig.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(cleanSig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return false;
  }
}
