"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface YoupiModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  amount: number;
  upiUri: string;
  payeeVpa: string;
  payeeName: string;
  onPaymentSuccess: (paymentId: string) => void;
}

export default function YoupiModal({
  isOpen,
  onClose,
  orderNumber,
  amount,
  upiUri,
  payeeVpa,
  payeeName,
  onPaymentSuccess,
}: YoupiModalProps) {
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy VPA to clipboard
  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(payeeVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Verify payment either by auto-poll or manual UTR submission
  const handleVerify = async (manualUtr?: string) => {
    const isManual = Boolean(manualUtr || utr.trim().length > 0);
    if (isManual) {
      setError(null);
      setVerifying(true);
    }
    try {
      const res = await fetch("/api/youpi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          utr: manualUtr || (utr.trim().length === 12 ? utr.trim() : undefined),
        }),
      });
      const data = await res.json();
      if (data.success && data.isPaid) {
        onPaymentSuccess(data.paymentId || "youpi_verified");
      } else if (isManual) {
        setError(data.error || "Payment not yet detected. Please check your bank transaction.");
      }
    } catch {
      if (isManual) {
        setError("Network error while verifying payment. Please retry.");
      }
    } finally {
      if (isManual) {
        setVerifying(false);
      }
    }
  };

  // Auto-poll every 4 seconds in background
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      handleVerify();
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, orderNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-neutral-950 border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-white tracking-wide">
              Scan & Pay with UPI
            </h3>
            <p className="text-xs text-gray-400">
              Order: <span className="font-mono text-[#D4AF37] font-semibold">{orderNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Amount Badge */}
        <div className="text-center py-2 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-white/5">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">Total Payable</span>
          <p className="text-3xl font-bold font-serif text-[#D4AF37] mt-0.5">
            ₹{amount.toLocaleString("en-IN")}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner mx-auto w-fit">
          <QRCodeSVG
            value={upiUri}
            size={190}
            level="H"
            includeMargin={true}
          />
          <p className="text-[10px] text-neutral-800 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
            <span>BHIM</span> • <span>Google Pay</span> • <span>PhonePe</span> • <span>Paytm</span>
          </p>
        </div>

        {/* Payee VPA Details */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Merchant VPA</span>
            <span className="font-mono font-bold text-white select-all">{payeeVpa}</span>
          </div>
          <button
            onClick={handleCopyVpa}
            className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] font-bold text-[11px] transition"
          >
            {copied ? "✓ Copied" : "Copy VPA"}
          </button>
        </div>

        {/* Mobile Open App Button */}
        <div className="block sm:hidden">
          <a
            href={upiUri}
            className="w-full block text-center py-3 bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:brightness-110 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20"
          >
            ⚡ Open UPI App (GPay / PhonePe / Paytm)
          </a>
        </div>

        {/* UTR Entry / Manual Confirmation */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block text-[11px] text-gray-300 font-semibold">
            Already Paid? Enter 12-Digit UPI Ref / UTR (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={12}
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 432109876543"
              className="flex-1 bg-neutral-900 border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
            />
            <button
              onClick={() => handleVerify(utr)}
              disabled={verifying}
              className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition disabled:opacity-50"
            >
              {verifying ? "Checking..." : "Confirm"}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-red-400 mt-1 font-medium">{error}</p>
          )}
        </div>

        <p className="text-[10px] text-gray-500 text-center">
          Payment is automatically verified in real-time. Do not close this window until complete.
        </p>
      </div>
    </div>
  );
}
