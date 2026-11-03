import Razorpay from "razorpay";
import crypto from "crypto";

export const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_dappersfitDemo";

export const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "dappersfitDemoSecretKey123";

/**
 * Checks if the current configuration is running on mock demo sandbox credentials
 */
export function isDemoMode(): boolean {
  return (
    !RAZORPAY_KEY_ID ||
    !RAZORPAY_KEY_SECRET ||
    RAZORPAY_KEY_ID.includes("dappersfitDemo") ||
    RAZORPAY_KEY_SECRET.includes("dappersfitDemo")
  );
}

/**
 * Initializes and returns the official Razorpay SDK instance
 */
export function getRazorpayClient(): Razorpay | null {
  if (isDemoMode()) {
    return null;
  }
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

/**
 * Verifies the payment signature returned by the Razorpay client after successful checkout.
 * Signature formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 */
export function verifySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  // Allow sandbox simulated checkout when running with demo credentials
  if (isDemoMode() && signature.startsWith("demo_sig_")) {
    return true;
  }

  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(signature)
    );
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
