"use client";

import React from "react";
import { useCart } from "@/context/CartContext";

export default function FloatingCartButton() {
  const { totalCount, finalTotal, toggleCart, isOpen } = useCart();

  if (isOpen) return null;

  return (
    <button
      onClick={toggleCart}
      aria-label="View Shopping Cart"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-black/90 hover:bg-black text-white px-4 py-3 rounded-full border border-[#D4AF37]/40 shadow-2xl backdrop-blur-md transition-all duration-300 transform hover:scale-105 active:scale-95 group cursor-pointer"
      style={{
        boxShadow: "0 10px 25px -5px rgba(212, 175, 55, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div className="relative">
        <svg
          className="w-6 h-6 text-[#D4AF37] group-hover:rotate-6 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>

        {totalCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {totalCount}
          </span>
        )}
      </div>

      <div className="flex flex-col text-left pr-1">
        <span className="text-[10px] tracking-widest uppercase font-bold text-[#D4AF37]">
          {totalCount === 0 ? "Cart" : `${totalCount} Item${totalCount > 1 ? "s" : ""}`}
        </span>
        <span className="text-xs font-bold text-gray-100">
          {totalCount === 0 ? "View Bag" : `₹${finalTotal.toLocaleString("en-IN")}`}
        </span>
      </div>
    </button>
  );
}
