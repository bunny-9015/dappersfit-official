import Link from "next/link";
import { ORDER_GUIDELINES } from "@/lib/policies";

export const metadata = {
  title: "Replacement & Refund Policy | DappersFit",
  description: "DappersFit unboxing video guidelines, 24-hour replacement support, and return/refund policy.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-10 space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <span className="text-xs uppercase tracking-[0.25em] text-[#996515] font-bold">
            DappersFit Policies
          </span>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mt-1">
            Replacement &amp; Refund Policy
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Sharing our order guidelines for your reference 😊
          </p>
        </div>

        <div className="space-y-3">
          {ORDER_GUIDELINES.map((g) => (
            <div key={g.num} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <h2 className="text-sm font-bold text-gray-900">
                {g.num}) {g.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{g.body}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
          <span>After receiving the product, kindly inform us 😊 Thank you for your understanding.</span>
          <Link href="/contact" className="text-[#996515] font-bold hover:underline">
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
