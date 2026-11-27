import Link from "next/link";
import { getWhatsAppChatUrl, DEFAULT_WHATSAPP_DISPLAY } from "@/lib/whatsapp";

export const metadata = {
  title: "Contact Us | DappersFit",
  description: "Reach DappersFit watch concierge via WhatsApp, Instagram, or email for order support and watch sourcing.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-[#996515] font-display font-bold">
            Concierge Support
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-gray-900">
            Contact DappersFit
          </h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Have a question about a timepiece, delivery tracking, or same-day replacement support? Reach our team directly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href={getWhatsAppChatUrl("Hi DappersFit! I need assistance with an order or watch enquiry.")}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:border-emerald-300 transition space-y-2"
          >
            <span className="inline-flex w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 items-center justify-center text-lg">
              💬
            </span>
            <h2 className="text-base font-serif font-bold text-gray-900">WhatsApp Concierge</h2>
            <p className="text-xs font-semibold text-emerald-700">{DEFAULT_WHATSAPP_DISPLAY}</p>
            <p className="text-xs text-gray-500">Fastest response • 10:00 AM – 9:00 PM IST</p>
          </a>

          <a
            href="mailto:dappersfit@gmail.com"
            className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:border-gray-300 transition space-y-2"
          >
            <span className="inline-flex w-10 h-10 rounded-xl bg-amber-50 text-[#996515] border border-amber-200 items-center justify-center text-lg">
              ✉️
            </span>
            <h2 className="text-base font-serif font-bold text-gray-900">Email Support</h2>
            <p className="text-xs font-semibold text-gray-900">dappersfit@gmail.com</p>
            <p className="text-xs text-gray-500">Order invoices &amp; replacement assistance</p>
          </a>

          <a
            href="https://www.instagram.com/dappers_fit_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:border-pink-300 transition space-y-2"
          >
            <span className="inline-flex w-10 h-10 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 items-center justify-center text-lg">
              📸
            </span>
            <h2 className="text-base font-serif font-bold text-gray-900">Instagram</h2>
            <p className="text-xs font-semibold text-pink-600">@dappers_fit_</p>
            <p className="text-xs text-gray-500">Daily new arrivals &amp; real unboxing videos</p>
          </a>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-serif font-bold text-gray-900">Quick Links</h2>
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <Link href="/shipping-policy" className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 transition">
              Shipping Policy
            </Link>
            <Link href="/refund-policy" className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 transition">
              Replacement &amp; Refund Policy
            </Link>
            <Link href="/terms" className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 transition">
              Order Guidelines &amp; Terms
            </Link>
            <Link href="/request-watch" className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white transition">
              Request a Rare Watch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
