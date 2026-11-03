import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  // 1. If not logged in at all, redirect to login page with return URL
  if (!session) {
    redirect("/login?redirect=/admin/orders&error=admin_required");
  }

  // 2. If logged in but is a regular CUSTOMER, display strict Access Denied screen
  if (session.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-red-400 font-bold">
              Access Restricted
            </span>
            <h1 className="text-2xl font-serif font-bold text-white">
              Administrator Privileges Required
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              You are currently signed in as a <span className="text-white font-semibold">Customer</span> ({session.email}). This area contains proprietary store analytics and order management tools restricted to store administrators.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition text-center shadow-lg"
            >
              Return to Storefront
            </Link>
            <Link
              href="/login?redirect=/admin/orders"
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white font-medium text-xs py-3 rounded-xl transition text-center border border-white/10"
            >
              Switch to Admin Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is verified ADMIN: Render admin pages
  return <>{children}</>;
}
