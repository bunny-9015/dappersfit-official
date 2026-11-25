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
      className="fixed bottom-5 right-5 z-40 flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-4 py-2.5 rounded-full border border-gray-200 shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 group cursor-pointer"
    >
      <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-[#D4AF37]">
        <svg
          className="w-4.5 h-4.5 group-hover:scale-105 transition-transform"
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
          <span className="absolute -top-1.5 -right-1.5 bg-[#996515] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
            {totalCount}
          </span>
        )}
      </div>

      <div className="flex flex-col text-left pr-1.5">
        <span className="text-[10px] tracking-widest uppercase font-bold text-[#996515]">
          {totalCount === 0 ? "Your Bag" : `${totalCount} Item${totalCount > 1 ? "s" : ""}`}
        </span>
        <span className="text-xs font-bold text-gray-900">
          {totalCount === 0 ? "Open Cart" : `₹${finalTotal.toLocaleString("en-IN")}`}
        </span>
      </div>
    </button>
  );
}
