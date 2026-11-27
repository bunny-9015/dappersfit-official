export const ORDER_GUIDELINES = [
  {
    num: "1",
    title: "Opening Video",
    body: "Please record a clear opening video while unboxing the parcel. The video should be continuous (no cuts/pauses) and show the full package opening. This helps us assist you in case of any issue.",
  },
  {
    num: "2",
    title: "Replacement Support",
    body: "If any defect is noticed, it should be clearly visible in the opening video. Replacement requests should be informed on the same day of delivery.",
  },
  {
    num: "3",
    title: "Support Time",
    body: "Kindly inform us within 24 hours of receiving the product, along with the opening video, so we can assist you properly.",
  },
  {
    num: "4",
    title: "Without Opening Video",
    body: "Without an opening video, we may not be able to provide support, as we cannot verify handling after delivery.",
  },
  {
    num: "5",
    title: "Tracking Details",
    body: "Tracking ID will be shared automatically via Shiprocket message. You can track the order online using the link provided.",
  },
  {
    num: "6",
    title: "Courier Charges",
    body: "Courier charges may vary based on your delivery location.",
  },
  {
    num: "7",
    title: "Policy",
    body: "We provide replacement support. Return, refund, and cancellation are not available.",
  },
] as const;

export function trackStoreEvent(
  eventName: "AddToCart" | "InitiateCheckout" | "Purchase",
  params: { value: number; currency?: string; orderId?: string; numItems?: number }
) {
  if (typeof window === "undefined") return;
  const win = window as any;
  const currency = params.currency || "INR";
  try {
    if (typeof win.fbq === "function") {
      win.fbq("track", eventName, {
        value: params.value,
        currency,
        content_type: "product",
        num_items: params.numItems || 1,
        ...(params.orderId ? { order_id: params.orderId } : {}),
      });
    }
    if (typeof win.gtag === "function") {
      const gaName =
        eventName === "AddToCart"
          ? "add_to_cart"
          : eventName === "InitiateCheckout"
          ? "begin_checkout"
          : "purchase";
      win.gtag("event", gaName, {
        value: params.value,
        currency,
        ...(params.orderId ? { transaction_id: params.orderId } : {}),
      });
    }
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({
      event: eventName,
      value: params.value,
      currency,
      orderId: params.orderId || undefined,
    });
  } catch {}
}
