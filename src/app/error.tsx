"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center px-4 py-16 text-center">
      <div className="max-w-md w-full border border-neutral-800 bg-neutral-900/60 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
        <span className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold block mb-3">
          Dappersfit Concierge
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
          Experiencing a Brief Delay
        </h2>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          Our luxury collection is synchronizing with the secure cloud servers. Please refresh to continue exploring.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-lg bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-sm transition-all duration-200 cursor-pointer"
          >
            Refresh Collection
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-sm font-medium transition-all duration-200"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
