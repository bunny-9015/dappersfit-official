import Link from "next/link";

export const metadata = {
  title: "Shipping Policy | DappersFit",
  description: "Pan-India shipping timelines, Shiprocket tracking, courier charges, and COD delivery guidelines.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-10 space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <span className="text-xs uppercase tracking-[0.25em] text-[#996515] font-bold">
            DappersFit Policies
          </span>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mt-1">Shipping Policy</h1>
          <p className="text-xs text-gray-500 mt-1">Pan-India Insured Dispatch &amp; Tracking</p>
        </div>

        <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-gray-900">1. Dispatch &amp; Delivery Timelines</h2>
            <p>
              Every timepiece undergoes multi-point quality inspection before dispatch. Standard Pan-India delivery takes <strong>3–5 business days</strong> (FREE), and Express Air Priority takes <strong>1–2 business days</strong> (₹199).
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-gray-900">2. Automatic Shiprocket Tracking</h2>
            <p>
              Once your order is dispatched, your <strong>Tracking ID is shared automatically via Shiprocket message</strong>. You can track your shipment online in real time using the link provided.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-gray-900">3. Courier Charges</h2>
            <p>
              Courier charges may vary based on your delivery location and selected shipping speed.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-gray-900">4. Cash on Delivery (COD)</h2>
            <p>
              COD orders require a <strong>₹150 prepaid COD handling fee via UPI</strong> at checkout to confirm dispatch. The full order amount is payable in cash at doorstep upon delivery.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-gray-900">5. Opening Video Requirement</h2>
            <p>
              Please record a clear, continuous opening video (no cuts or pauses) while unboxing your parcel. See our{" "}
              <Link href="/refund-policy" className="text-[#996515] font-semibold underline">
                Replacement &amp; Refund Policy
              </Link>{" "}
              for full details.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
