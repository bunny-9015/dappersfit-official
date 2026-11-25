/**
 * WhatsApp Integration Utilities for DappersFit
 * Supports automatic app opening on Mobile (iOS/Android) and WhatsApp Web / Desktop on PC/Mac.
 */

export const DEFAULT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917550148991";
export const DEFAULT_WHATSAPP_DISPLAY = "+91 75501 48991";

/**
 * Sanitizes phone number by removing spaces, +, dashes, brackets.
 * Automatically prepends India code 91 if a 10-digit number is provided.
 */
export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Generates official universal WhatsApp link
 */
export function getWhatsAppChatUrl(message: string, phone: string = DEFAULT_WHATSAPP_NUMBER): string {
  const clean = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

export interface WatchEnquiryData {
  id?: string;
  name: string;
  brand: string;
  price: number;
  imageUrl?: string | null;
}

/**
 * Formats rich enquiry message with Watch Picture, Brand, Model, and Price details
 */
export function formatWatchEnquiryMessage(watch: WatchEnquiryData, siteOrigin?: string): string {
  const origin = siteOrigin || process.env.NEXT_PUBLIC_APP_URL || "";
  const formattedPrice = new Intl.NumberFormat("en-IN").format(watch.price);

  let fullImageUrl = "";
  if (watch.imageUrl) {
    if (watch.imageUrl.startsWith("http://") || watch.imageUrl.startsWith("https://")) {
      fullImageUrl = watch.imageUrl;
    } else {
      fullImageUrl = `${origin}${watch.imageUrl.startsWith("/") ? "" : "/"}${watch.imageUrl}`;
    }
  }

  let msg = `👑 *DAPPERSFIT LUXURY TIMEPIECES - PRODUCT ENQUIRY*\n\n`;
  msg += `Hello DappersFit! I would like to enquire about this timepiece:\n\n`;
  msg += `🏷️ *Brand:* ${watch.brand}\n`;
  msg += `⌚ *Model:* ${watch.name}\n`;
  msg += `💰 *Price:* ₹${formattedPrice}\n`;
  if (fullImageUrl) {
    msg += `📸 *Watch Photo:* ${fullImageUrl}\n`;
  }
  if (watch.id) {
    msg += `🆔 *Product ID:* ${watch.id}\n`;
  }
  msg += `\n✨ Please confirm availability, specifications, and express dispatch timeline. Thank you!`;

  return msg;
}

/**
 * Opens WhatsApp conversation directly in device app or WhatsApp Web
 */
export function openWhatsAppEnquiry(watch: WatchEnquiryData, phone?: string): void {
  const msg = formatWatchEnquiryMessage(watch);
  const url = getWhatsAppChatUrl(msg, phone);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
