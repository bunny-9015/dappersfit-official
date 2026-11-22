"use client";

import React, { useState, useEffect } from "react";

export interface YoupiModalOrderData {
  orderId: string;
  orderNumber: string;
  amount: number;
  payeeVpa?: string;
  payeeName?: string;
  upiUri?: string;
  checkoutUrl?: string;
}

interface YoupiCheckoutModalProps {
  isOpen: boolean;
  orderData: YoupiModalOrderData | null;
  customerName?: string;
  customerPhone?: string;
  isProcessing: boolean;
  onVerifyUtr: (utr: string) => void;
  onClose: () => void;
}

export default function YoupiCheckoutModal({
  isOpen,
  orderData,
  customerName,
  customerPhone,
  isProcessing,
  onVerifyUtr,
  onClose,
}: YoupiCheckoutModalProps) {
  const [utrInput, setUtrInput] = useState("");
  const [modalSecondsLeft, setModalSecondsLeft] = useState(300);
  const [copiedVpa, setCopiedVpa] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setModalSecondsLeft(300);
    setUtrInput("");
    const timer = setInterval(() => {
      setModalSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, orderData?.orderNumber]);

  if (!isOpen || !orderData) return null;

  const cleanPhone = customerPhone
    ? customerPhone.replace(/\D/g, "").slice(-10)
    : "";

  return (
    <div className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[900px] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[94vh] overflow-y-auto">
        {/* LEFT GOLD SIDEBAR (Exact YouPI-PG DAPPERSFIT Theme) */}
        <aside
          className="w-full md:w-[305px] shrink-0 text-white p-5 sm:p-6 flex flex-col justify-between"
          style={{
            background: "linear-gradient(180deg, #c49b1a 0%, #9f7c10 100%)",
          }}
        >
          <div className="space-y-3.5">
            {/* Brand Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center font-black text-xl text-white shadow-inner">
                D
              </div>
              <div>
                <div className="font-extrabold text-base tracking-wide text-white leading-tight">
                  {orderData.payeeName || "DAPPERSFIT"}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-flex items-center justify-center text-[9px] font-black">
                    ✓
                  </span>
                  <span>DAPPERSFIT Verified Luxury Store</span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-white/15 border border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-white flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>500+ orders last month from DAPPERSFIT</span>
            </div>

            {/* Price Summary Card */}
            <div className="bg-white rounded-xl p-4 text-slate-900 shadow-md">
              <div className="text-xs font-semibold text-slate-500">Price Summary</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                ₹{Number(orderData.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Customer Profile Row */}
            <div className="bg-white/15 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white flex items-center justify-between">
              <span className="truncate flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="truncate">
                  Using as {customerName || "Customer"}{" "}
                  {cleanPhone ? `(+91 ${cleanPhone})` : ""}
                </span>
              </span>
              <span className="text-white/80 ml-1">›</span>
            </div>
          </div>

          {/* Bottom Isometric Shopping Bags Graphic */}
          <div className="hidden md:flex justify-center pt-6 mt-auto">
            <svg viewBox="0 0 260 160" width="210" height="128" fill="none">
              <ellipse cx="130" cy="145" rx="100" ry="12" fill="rgba(0,0,0,0.18)" />
              <path d="M100 65 L135 60 L145 135 L90 140 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M100 65 L135 60 L140 85 L95 90 Z" fill="#f1f5f9" />
              <path d="M110 63 C110 48, 125 48, 125 61" stroke="#0284c7" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M140 75 L180 70 L195 135 L135 140 Z" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
              <path d="M150 73 C150 58, 168 58, 168 71" stroke="#047857" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="160" cy="98" r="14" fill="#34d399" />
              <text x="160" y="103" fontSize="12" fontWeight="900" fill="#064e3b" textAnchor="middle">%</text>
              <path d="M55 100 L95 95 L105 140 L50 142 Z" fill="#0284c7" />
              <path d="M50 100 L95 95 L95 105 L48 108 Z" fill="#38bdf8" />
              <rect x="71" y="96" width="7" height="45" fill="#ffffff" />
            </svg>
          </div>
        </aside>

        {/* RIGHT WHITE PAYMENT WORKSPACE */}
        <div className="flex-1 bg-white flex flex-col">
          {/* Top Bar */}
          <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-base">Payment Options</div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-lg leading-none select-none">•••</span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
                aria-label="Close payment modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 2-Sub-Column Body */}
          <div className="flex-1 flex flex-col sm:flex-row">
            {/* Method Selector Left Sub-Column */}
            <div className="hidden sm:block w-[225px] bg-white border-r border-slate-200 p-4 space-y-2.5 shrink-0">
              <div className="bg-white border-2 border-[#c49b1a] rounded-xl p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <img src="/icons/youpi/upi.svg" alt="UPI" className="h-4 w-auto" />
                  <span className="font-bold text-sm text-slate-900">UPI QR</span>
                </div>
                <div className="text-xs text-slate-500 mt-1.5">Scan &amp; Pay via UPI Apps</div>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <img src="/icons/youpi/gpay.png" alt="GPay" className="w-5 h-5 rounded object-contain" />
                  <img src="/icons/youpi/phonepe.png" alt="PhonePe" className="w-5 h-5 rounded object-contain" />
                  <img src="/icons/youpi/paytm.png" alt="Paytm" className="w-5 h-5 rounded object-contain" />
                  <img src="/icons/youpi/cred.png" alt="CRED" className="w-5 h-5 rounded object-contain" />
                </div>
              </div>
            </div>

            {/* Active UPI QR Workspace */}
            <div className="flex-1 bg-white p-5 space-y-4 flex flex-col">
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-900">UPI QR Payment</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Scan &amp; Pay via UPI</span>
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono">
                    <span>🕒</span>
                    <span>
                      {String(Math.floor(modalSecondsLeft / 60)).padStart(2, "0")}:
                      {String(modalSecondsLeft % 60).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Server Health Indicator */}
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Server Is Working</span>
                </div>
              </div>

              {/* Core UPI QR Card */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-4">
                {orderData.upiUri && (
                  <div className="w-36 h-36 shrink-0 bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        orderData.upiUri
                      )}`}
                      alt="DAPPERSFIT UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <div className="text-xs font-bold text-slate-800">
                    Scan the QR using any UPI App
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {[
                      { name: "Google Pay", icon: "/icons/youpi/gpay.png" },
                      { name: "PhonePe", icon: "/icons/youpi/phonepe.png" },
                      { name: "Paytm", icon: "/icons/youpi/paytm.png" },
                      { name: "CRED", icon: "/icons/youpi/cred.png" },
                      { name: "BHIM UPI", icon: "/icons/youpi/bhim.png" },
                      { name: "Amazon Pay", icon: "/icons/youpi/amazonpay.png" },
                    ].map((app) => (
                      <a
                        key={app.name}
                        href={orderData.upiUri || "#"}
                        title={app.name}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-[#c49b1a] flex items-center justify-center p-1 shadow-2xs transition"
                      >
                        <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                      </a>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    Open any UPI app on your phone to scan and pay directly.
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                      {orderData.payeeVpa || "pinelabs.stq4525474@pineaxis"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          orderData.payeeVpa || "pinelabs.stq4525474@pineaxis"
                        );
                        setCopiedVpa(true);
                        setTimeout(() => setCopiedVpa(false), 2000);
                      }}
                      className="text-[11px] font-bold text-[#9f7c10] hover:underline cursor-pointer"
                    >
                      {copiedVpa ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* UTR Input + Payment Done CTA */}
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter 12-Digit UPI UTR / Reference No. after paying"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#c49b1a]"
                  />
                  <button
                    type="button"
                    onClick={() => onVerifyUtr(utrInput)}
                    disabled={isProcessing}
                    className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    ✓ Payment Done — Verify
                  </button>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="mt-auto pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
                Secured by DAPPERSFIT &amp; 256-Bit Bank Encryption &bull;{" "}
                <span className="underline">Privacy Notice</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
