"use client";

import React, { useState, useEffect } from "react";
import { ORDER_GUIDELINES } from "@/lib/policies";

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  payableLabel: string;
}

export default function TermsAcceptanceModal({
  isOpen,
  onClose,
  onAccept,
  payableLabel,
}: TermsAcceptanceModalProps) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) setAccepted(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Order Guidelines and Terms & Conditions"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white text-gray-900 rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#996515]">
              Before You Pay
            </span>
            <h2 className="text-lg font-serif font-bold text-gray-900">
              Order Guidelines &amp; Terms
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable 7 Guidelines */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3 bg-gray-50/50">
          <p className="text-xs text-gray-600">
            Sharing our order guidelines for your reference 😊
          </p>

          <div className="space-y-2.5">
            {ORDER_GUIDELINES.map((g) => (
              <div
                key={g.num}
                className="p-3 bg-white rounded-2xl border border-gray-200/90 text-xs space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-50 text-[#996515] border border-amber-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {g.num}
                  </span>
                  <h3 className="font-bold text-gray-900">{g.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed pl-7">{g.body}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center pt-1">
            After receiving the product, kindly inform us 😊 Thank you for your understanding.
          </p>
        </div>

        {/* Mandatory Checkbox + CTA */}
        <div className="p-5 border-t border-gray-200 bg-white space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-gray-900 rounded cursor-pointer shrink-0"
            />
            <span className="text-xs font-medium text-gray-800 leading-snug">
              I have read and accept the DappersFit Terms &amp; Order Guidelines (continuous unboxing video required; replacement only, no return/refund/cancellation).
            </span>
          </label>

          <button
            type="button"
            disabled={!accepted}
            onClick={onAccept}
            className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
          >
            Accept &amp; {payableLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
