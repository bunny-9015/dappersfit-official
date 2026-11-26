"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { createOrder, getUserSession } from "@/app/actions";
import PriceTag from "@/components/PriceTag";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";
import YoupiModal from "@/components/YoupiModal";
import { downloadOrPrintInvoice, InvoicePayload } from "@/lib/invoice";

const COD_ADVANCE_AMOUNT = 300;

const fmt = (val: number | string | undefined | null) => {
  const n = Number(val);
  return isNaN(n) ? "0" : n.toLocaleString("en-IN");
};

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    setQuantity,
    clearCart,
    totalCount,
    subtotal,
    shippingMethod,
    setShippingMethod,
    shippingCost,
    appliedPromo,
    discountAmount,
    applyPromoCode,
    removePromoCode,
    taxAmount,
    finalTotal,
    includeOgRolexBox,
    setIncludeOgRolexBox,
    hasRolexInCart,
    rolexBoxPrice,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedSummary, setConfirmedSummary] = useState<{
    total: number;
    paidNow: number;
    balanceDue: number;
    method: "upi" | "cod";
    invoice: InvoicePayload;
  } | null>(null);

  const [showYoupiModal, setShowYoupiModal] = useState(false);
  const [youpiOrderData, setYoupiOrderData] = useState<{
    orderNumber: string;
    amount: number;
    upiUri: string;
    payeeVpa: string;
    payeeName: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "upi" as "upi" | "cod",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const codAdvance = Math.min(COD_ADVANCE_AMOUNT, Math.max(0, finalTotal));
  const codBalance = Math.max(0, finalTotal - codAdvance);
  const payableNow = formData.paymentMethod === "cod" ? codAdvance : finalTotal;

  useEffect(() => {
    getUserSession()
      .then((session) => {
        if (session) {
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || session.name || "",
            email: prev.email || session.email || "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleYoupiPaymentSuccess = (pId: string) => {
    setPaymentId(pId);
    setShowYoupiModal(false);
    setOrderConfirmed(true);
    clearCart();
  };

  useEffect(() => {
    const onSuccess = (e: any) => {
      const { order_id, utr } = e?.detail || {};
      handleYoupiPaymentSuccess(utr || order_id || "youpi_verified");
    };
    const onFailed = (e: any) => {
      setPaymentError(e?.detail?.reason || "Payment was not completed.");
    };
    window.addEventListener("youpi:payment:success", onSuccess);
    window.addEventListener("youpi:payment:observed", onSuccess);
    window.addEventListener("youpi:payment:failed", onFailed);
    return () => {
      window.removeEventListener("youpi:payment:success", onSuccess);
      window.removeEventListener("youpi:payment:observed", onSuccess);
      window.removeEventListener("youpi:payment:failed", onFailed);
    };
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Valid 10-digit phone number is required";
    }
    if (!formData.address.trim()) errors.address = "Delivery address is required";
    if (!formData.pincode.trim() || formData.pincode.replace(/\D/g, "").length < 6) {
      errors.pincode = "Valid 6-digit PIN code is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyPromo = () => {
    const res = applyPromoCode(promoInput);
    setPromoMessage({ type: res.success ? "success" : "error", text: res.message });
    if (res.success) setPromoInput("");
  };

  const formatWhatsAppMessage = (id: string, payIdText?: string) => {
    let msg = `*DAPPERSFIT LUXURY ORDER #${id}*\n\n`;
    items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.brand.toUpperCase()} - ${item.name} (${item.quantity} × ₹${fmt(item.price)})\n`;
    });
    msg += `\n*Total: ₹${fmt(confirmedSummary?.total ?? finalTotal)}*\n`;
    if (formData.paymentMethod === "cod") {
      msg += `*Payment:* COD Advance ₹${fmt(confirmedSummary?.paidNow ?? codAdvance)} Paid via UPI | Balance ₹${fmt(confirmedSummary?.balanceDue ?? codBalance)} on delivery\n`;
    } else {
      msg += `*Payment:* Full UPI Paid (₹${fmt(confirmedSummary?.paidNow ?? finalTotal)})\n`;
    }
    if (payIdText) msg += `*Ref:* ${payIdText}\n`;
    msg += `*Deliver To:* ${formData.fullName}, ${formData.phone}, ${formData.address} ${formData.city} - ${formData.pincode}`;
    return msg;
  };

  const handleProceedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!validateForm()) return;

    const newId = `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    const isCod = formData.paymentMethod === "cod";
    const chargeAmount = isCod ? codAdvance : finalTotal;
    const balanceDue = isCod ? codBalance : 0;

    setOrderId(newId);
    setIsProcessingPayment(true);

    try {
      try {
        await createOrder({
          orderNumber: newId,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: formData.email || undefined,
          shippingAddress: formData.address,
          city: formData.city || undefined,
          state: formData.state || undefined,
          pincode: formData.pincode || undefined,
          paymentMethod: isCod ? "cod_advance" : "youpi_upi",
          paymentStatus: "pending",
          subtotal,
          discountAmount,
          promoCode: appliedPromo?.code || undefined,
          shippingCost,
          shippingMethod,
          taxAmount,
          totalAmount: finalTotal,
          items: items.map((it) => ({
            productId: it.id,
            productName: it.name,
            brand: it.brand || "Luxury",
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl,
          })),
        });
      } catch {}

      const youpiRes = await fetch("/api/youpi/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newId,
          amount: chargeAmount,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          metadata: {
            items: items.map((it) => ({
              name: it.name,
              brand: it.brand || "Luxury",
              qty: it.quantity,
              price: it.price,
            })),
            includeOgRolexBox: includeOgRolexBox && hasRolexInCart,
            customerName: formData.fullName,
            customerPhone: formData.phone,
            shippingAddress: [formData.address, formData.city, formData.state, formData.pincode]
              .filter(Boolean)
              .join(", "),
            paymentMode: isCod ? "COD_ADVANCE" : "UPI_FULL",
            orderTotal: finalTotal,
            codBalanceDue: balanceDue,
          },
        }),
      });
      const youpiData = await youpiRes.json();
      if (!youpiData.success) {
        throw new Error(youpiData.error || "Failed to initialize UPI session.");
      }

      setConfirmedSummary({
        total: finalTotal,
        paidNow: chargeAmount,
        balanceDue,
        method: formData.paymentMethod,
        invoice: {
          orderNumber: newId,
          createdAt: new Date().toISOString(),
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: formData.email || null,
          shippingAddress: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          paymentMethod: isCod ? "cod_advance" : "youpi_upi",
          paymentStatus: isCod ? "partial_paid" : "paid",
          orderStatus: "Confirmed",
          shippingMethod,
          subtotal,
          discountAmount,
          promoCode: appliedPromo?.code || null,
          shippingCost,
          totalAmount: finalTotal,
          paidNow: chargeAmount,
          balanceDue,
          includeOgRolexBox: includeOgRolexBox && hasRolexInCart,
          rolexBoxPrice,
          items: items.map((it) => ({
            name: it.name,
            brand: it.brand || "DappersFit",
            quantity: it.quantity,
            price: it.price,
          })),
        },
      });

      const win = typeof window !== "undefined" ? (window as any) : null;
      if (win && win.Youpi && typeof win.Youpi.pay === "function") {
        try {
          await win.Youpi.pay({
            order_id: newId,
            paymentId: youpiData.sessionId || youpiData.paymentId,
            checkoutUrl: youpiData.checkoutUrl,
            amount: chargeAmount,
            currency: "INR",
            customer: { name: formData.fullName, phone: formData.phone },
            portalUrl: "https://pay.dappersfit.com",
            handler: function (response: any) {
              handleYoupiPaymentSuccess(response?.paymentId || response?.utr || "youpi_verified");
            },
            onFailed: function (response: any) {
              setPaymentError(response?.reason || "Payment was not completed.");
            },
          });
          setIsProcessingPayment(false);
          return;
        } catch {}
      }

      setYoupiOrderData({
        orderNumber: newId,
        amount: chargeAmount,
        upiUri: youpiData.upiUri,
        payeeVpa: youpiData.payeeVpa || "kamathamlokesh9015@dbs",
        payeeName: youpiData.payeeName || "Dappersfit",
      });
      setShowYoupiModal(true);
    } catch (err: any) {
      setPaymentError(err?.message || "Could not launch UPI gateway.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
              <Link href="/" className="hover:text-gray-900 transition">Home</Link>
              <span>/</span>
              <span className="text-[#996515] font-semibold">Shopping Bag</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
              Shopping Bag &amp; Checkout
            </h1>
          </div>
          {items.length > 0 && !orderConfirmed && (
            <div className="flex items-center gap-4">
              <Link href="/#explore-by-brand" className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition">
                ← Continue Shopping
              </Link>
              <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-600 transition cursor-pointer">
                Clear Bag
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 && !orderConfirmed && (
          <div className="text-center py-20 space-y-4 bg-white rounded-3xl border border-gray-200 shadow-xs max-w-xl mx-auto p-8">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Your Bag is Empty</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Discover our authenticated luxury timepieces and select your signature watch.
            </p>
            <Link
              href="/#explore-by-brand"
              className="inline-block px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-full transition shadow-md"
            >
              Explore Watches
            </Link>
          </div>
        )}

        {/* Confirmed State */}
        {orderConfirmed && (
          <div className="text-center py-14 space-y-6 bg-white rounded-3xl border border-emerald-200 shadow-sm max-w-xl mx-auto p-8">
            <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#996515] uppercase">Order #{orderId}</span>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mt-1">Thank You for Your Order!</h2>
              <p className="text-sm text-gray-500 mt-2">
                Payment verified for <strong className="text-gray-900">{formData.fullName}</strong>.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Total</span>
                <span className="font-bold text-gray-900">₹{fmt(confirmedSummary?.total ?? finalTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid via UPI</span>
                <span className="font-bold text-emerald-700">₹{fmt(confirmedSummary?.paidNow ?? payableNow)}</span>
              </div>
              {confirmedSummary?.method === "cod" && confirmedSummary.balanceDue > 0 && (
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Balance Due on Delivery (COD)</span>
                  <span className="font-bold text-gray-900">₹{fmt(confirmedSummary.balanceDue)}</span>
                </div>
              )}
              {paymentId && (
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Transaction Ref</span>
                  <span className="font-mono text-gray-700">{paymentId}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              {confirmedSummary?.invoice && (
                <button
                  type="button"
                  onClick={() => downloadOrPrintInvoice(confirmedSummary.invoice)}
                  className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
                >
                  📄 Download / Print Invoice (PDF)
                </button>
              )}
              <a
                href={getWhatsAppChatUrl(formatWhatsAppMessage(orderId, paymentId))}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition"
              >
                WhatsApp Receipt
              </a>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs uppercase tracking-wider rounded-xl transition"
              >
                Back to Store
              </Link>
            </div>
          </div>
        )}

        {/* Active 2-Column White Checkout */}
        {items.length > 0 && !orderConfirmed && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Items & Delivery Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
                <h2 className="text-lg font-serif font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Items ({totalCount})
                </h2>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#996515]">{item.brand}</span>
                            <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            aria-label="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-0.5">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg hover:bg-white text-gray-800 font-bold cursor-pointer">−</button>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) setQuantity(item.id, val);
                              }}
                              className="w-8 text-center text-xs font-bold bg-transparent text-gray-900 focus:outline-none"
                            />
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg hover:bg-white text-gray-800 font-bold cursor-pointer">+</button>
                          </div>
                          <span className="text-base font-bold text-gray-900">₹{fmt(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Payment Form */}
              <form onSubmit={handleProceedOrder} className="bg-white rounded-3xl border border-gray-200 p-6 space-y-5 shadow-xs">
                <h2 className="text-lg font-serif font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Shipping &amp; Payment
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Your full name"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-gray-900"
                    />
                    {formErrors.fullName && <p className="text-red-600 text-[10px] mt-1">{formErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-gray-900"
                    />
                    {formErrors.phone && <p className="text-red-600 text-[10px] mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House/Flat No., Street, Landmark"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-gray-900"
                  />
                  {formErrors.address && <p className="text-red-600 text-[10px] mt-1">{formErrors.address}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="400001"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-gray-900"
                    />
                    {formErrors.pincode && <p className="text-red-600 text-[10px] mt-1">{formErrors.pincode}</p>}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2.5 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#996515]">Payment Option</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                        formData.paymentMethod === "upi"
                          ? "bg-amber-50/50 border-gray-900 ring-1 ring-gray-900"
                          : "bg-gray-50/60 border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cartPayMethod"
                        checked={formData.paymentMethod === "upi"}
                        onChange={() => setFormData({ ...formData, paymentMethod: "upi" })}
                        className="mt-0.5 accent-gray-900"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900">Instant UPI / QR</p>
                        <p className="text-[11px] text-gray-500">Pay full ₹{fmt(finalTotal)} now</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                        formData.paymentMethod === "cod"
                          ? "bg-amber-50/50 border-gray-900 ring-1 ring-gray-900"
                          : "bg-gray-50/60 border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cartPayMethod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                        className="mt-0.5 accent-gray-900"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900">Cash on Delivery</p>
                        <p className="text-[11px] text-gray-500">
                          ₹{codAdvance} UPI advance now • ₹{fmt(codBalance)} on delivery
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {paymentError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment
                    ? "Launching Secure UPI Gateway..."
                    : formData.paymentMethod === "cod"
                    ? `Pay ₹${fmt(codAdvance)} COD Advance via UPI`
                    : `Pay ₹${fmt(payableNow)} via UPI`}
                </button>
              </form>
            </div>

            {/* Right: Sticky Summary */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              {hasRolexInCart && (
                <div className="bg-emerald-50/80 rounded-3xl border border-emerald-200 p-5 space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs font-bold text-emerald-950">👑 Official OG Rolex Box</p>
                      <p className="text-[11px] text-emerald-900/75 mt-0.5">
                        Green presentation case, warranty card &amp; wax seal tag.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-1 rounded-lg">
                      +₹{rolexBoxPrice}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 pt-2 border-t border-emerald-200/70 cursor-pointer text-xs font-semibold text-emerald-950">
                    <input
                      type="checkbox"
                      checked={includeOgRolexBox}
                      onChange={(e) => setIncludeOgRolexBox(e.target.checked)}
                      className="w-4 h-4 accent-emerald-700"
                    />
                    <span>{includeOgRolexBox ? "Included (+₹499)" : "Add OG Rolex Box"}</span>
                  </label>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
                <h2 className="text-base font-serif font-bold text-gray-900">Order Summary</h2>

                {/* Shipping */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShippingMethod("standard")}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      shippingMethod === "standard" ? "border-gray-900 ring-1 ring-gray-900 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>Standard</span>
                      <span className="text-emerald-600">FREE</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">3–5 Days</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingMethod("express")}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      shippingMethod === "express" ? "border-gray-900 ring-1 ring-gray-900 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>Express</span>
                      <span className="text-[#996515]">₹199</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">1–2 Days Air</p>
                  </button>
                </div>

                {/* Promo */}
                <div className="space-y-1.5">
                  {appliedPromo ? (
                    <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                      <span className="font-bold text-emerald-800">{appliedPromo.code} (−₹{fmt(discountAmount)})</span>
                      <button onClick={() => { removePromoCode(); setPromoMessage(null); }} className="text-emerald-700 hover:text-red-600 font-semibold cursor-pointer">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-gray-900"
                      />
                      <button type="button" onClick={handleApplyPromo} className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl cursor-pointer">
                        Apply
                      </button>
                    </div>
                  )}
                  {promoMessage && (
                    <p className={`text-[11px] ${promoMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                      {promoMessage.text}
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{fmt(subtotal)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-700 text-xs">
                      <span>Discount</span>
                      <span>−₹{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-600">{shippingCost === 0 ? "FREE" : `₹${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>GST (18% Included)</span>
                    <span>₹{fmt(taxAmount)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-gray-900">Total</span>
                    <PriceTag price={finalTotal} size="lg" theme="light" showOriginal={false} />
                  </div>
                  {formData.paymentMethod === "cod" && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>Pay Now (COD Advance)</span>
                        <span className="text-[#996515]">₹{fmt(codAdvance)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Balance at Doorstep</span>
                        <span>₹{fmt(codBalance)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {youpiOrderData && (
        <YoupiModal
          isOpen={showYoupiModal}
          onClose={() => setShowYoupiModal(false)}
          orderNumber={youpiOrderData.orderNumber}
          amount={youpiOrderData.amount}
          upiUri={youpiOrderData.upiUri}
          payeeVpa={youpiOrderData.payeeVpa}
          payeeName={youpiOrderData.payeeName}
          onPaymentSuccess={handleYoupiPaymentSuccess}
        />
      )}
    </div>
  );
}
