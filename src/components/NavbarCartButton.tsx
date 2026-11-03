"use client";

import React from "react";
import { useCart } from "@/context/CartContext";

export default function NavbarCartButton() {
  const { totalCount, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition cursor-pointer text-xs font-semibold"
      aria-label="Shopping Cart"
    >
      <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <span className="hidden sm:inline">Cart</span>
      {totalCount > 0 && (
        <span className="bg-[#D4AF37] text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
          {totalCount}
        </span>
      )}
    </button>
  );
}
