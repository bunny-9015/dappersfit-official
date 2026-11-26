"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/app/actions";
import PriceTag from "./PriceTag";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";
import YoupiModal from "@/components/YoupiModal";
import { downloadOrPrintInvoice, InvoicePayload } from "@/lib/invoice";

const COD_ADVANCE_AMOUNT = 150;

const fmt = (val: number | string | undefined | null) => {
  const n = Number(val);
  return isNaN(n) ? "0" : n.toLocaleString("en-IN");
};

export default function CartDrawer() {
  const {
    items,
    isOpen,
    setIsOpen,
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
    toastMessage,
    clearToast,
    includeOgRolexBox,
    setIncludeOgRolexBox,
    hasRolexInCart,
    rolexBoxPrice,
  } = useCart();

  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [promoInput, setPromoInput] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "upi" as "upi" | "cod",
  });

  const [showYoupiModal, setShowYoupiModal] = useState(false);
  const [youpiOrderData, setYoupiOrderData] = useState<{
    orderNumber: string;
    amount: number;
    upiUri: string;
    payeeVpa: string;
    payeeName: string;
  } | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [orderId, setOrderId] = useState("");
  const [confirmedSummary, setConfirmedSummary] = useState<{
    total: number;
    paidNow: number;
    balanceDue: number;
    method: "upi" | "cod";
    invoice: InvoicePayload;
  } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const codAdvance = COD_ADVANCE_AMOUNT;
  const codBalance = Math.max(0, finalTotal);
  const payableNow = formData.paymentMethod === "cod" ? codAdvance : finalTotal;

  // Lock background scroll & support Escape key when popup is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setIsOpen]);

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
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput.trim());
    setPromoFeedback({ type: res.success ? "success" : "error", text: res.message });
    if (res.success) setPromoInput("");
  };

  const generateWhatsAppMessage = (currentOrderId?: string) => {
    const id = currentOrderId || `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    let message = `*DAPPERSFIT LUXURY TIMEPIECES - ORDER #${id}*\n\n`;
    message += `*ORDER SUMMARY:*\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. *${(item.brand || "Luxury").toUpperCase()}* - ${item.name || "Watch"} (${item.quantity || 1} × ₹${fmt(item.price)})\n`;
    });
    message += `\n*COST BREAKDOWN:*\n`;
    message += `• Subtotal: ₹${fmt(subtotal)}\n`;
    if (includeOgRolexBox && hasRolexInCart) {
      message += `• Official OG Rolex Box: +₹${rolexBoxPrice}\n`;
    }
    if (appliedPromo) {
      message += `• Promo (${appliedPromo.code}): -₹${fmt(discountAmount)}\n`;
    }
    message += `• Shipping: ${shippingCost === 0 ? "FREE Standard" : `₹${shippingCost} (Express Air)`}\n`;
    message += `• *TOTAL: ₹${fmt(finalTotal)}*\n`;
    if (formData.paymentMethod === "cod") {
      message += `• Payment Mode: COD (₹${fmt(codAdvance)} UPI Advance + ₹${fmt(codBalance)} on delivery)\n`;
    } else {
      message += `• Payment Mode: Instant UPI (₹${fmt(finalTotal)})\n`;
    }
    if (formData.fullName || formData.phone || formData.address) {
      message += `\n*DELIVERY DETAILS:*\n`;
      if (formData.fullName) message += `• Name: ${formData.fullName}\n`;
      if (formData.phone) message += `• Phone: ${formData.phone}\n`;
      if (formData.address) message += `• Address: ${formData.address}, ${formData.city} ${formData.state} - ${formData.pincode}\n`;
    }
    return message;
  };

  const handleWhatsAppOrder = async () => {
    const id = `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      await createOrder({
        orderNumber: id,
        customerName: formData.fullName || "WhatsApp Customer",
        customerPhone: formData.phone || "Direct Chat",
        shippingAddress: formData.address || "Pending via WhatsApp Chat",
        city: formData.city || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
        paymentMethod: "cod_advance",
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
    window.open(getWhatsAppChatUrl(generateWhatsAppMessage(id)), "_blank");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!validateForm()) return;

    const newId = `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    const isCod = formData.paymentMethod === "cod";
    const chargeAmount = isCod ? codAdvance : finalTotal;
    const balanceDue = isCod ? codBalance : 0;

    setOrderId(newId);
    setIsInitiatingPayment(true);

    try {
      try {
        await createOrder({
          orderNumber: newId,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
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
      } catch {
        // Non-blocking
      }

      const youpiRes = await fetch("/api/youpi/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newId,
          amount: chargeAmount,
          customerName: formData.fullName,
          customerPhone: formData.phone,
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
        setPaymentError(youpiData.error || "Unable to launch UPI gateway. Please try again.");
        setIsInitiatingPayment(false);
        return;
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
              setPaymentError(response?.reason || "Payment was not completed. Please retry.");
            },
          });
          setIsInitiatingPayment(false);
          return;
        } catch (payErr) {
          console.warn("Youpi.pay fallback to embedded modal:", payErr);
        }
      }

      setYoupiOrderData({
        orderNumber: newId,
        amount: chargeAmount,
        upiUri: youpiData.upiUri,
        payeeVpa: youpiData.payeeVpa || "kamathamlokesh9015@dbs",
        payeeName: youpiData.payeeName || "Dappersfit",
      });
      setShowYoupiModal(true);
    } catch (err) {
      console.error("YouPI init error:", err);
      setPaymentError("Could not connect to payment server. Please retry.");
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const handleYoupiPaymentSuccess = (_paymentId: string) => {
    setShowYoupiModal(false);
    setStep("success");
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

  return (
    <>
      {/* Clean White Floating Toast Notification */}
      {toastMessage && !isOpen && (
        <div className="fixed top-20 right-4 sm:right-6 z-[95]">
          <div className="bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <p className="text-xs font-semibold text-gray-800">{toastMessage}</p>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="ml-1 bg-gray-900 hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition"
            >
              View Bag
            </button>
            <button
              type="button"
              onClick={clearToast}
              className="text-gray-400 hover:text-gray-700 text-xs px-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* White Luxury Popup Cart Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered White Popup Card */}
          <div className="relative z-10 w-full sm:max-w-2xl bg-white text-gray-900 rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-[#996515] border border-amber-200/80 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-serif font-bold text-gray-900 leading-tight">
                    {step === "cart" && "Your Shopping Bag"}
                    {step === "checkout" && "Secure Checkout"}
                    {step === "success" && "Order Confirmed"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {step === "cart" && `${totalCount} ${totalCount === 1 ? "timepiece" : "timepieces"} selected`}
                    {step === "checkout" && "Delivery details & instant UPI verification"}
                    {step === "success" && "Thank you for shopping with DappersFit"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step === "checkout" && (
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    className="text-xs font-semibold text-[#996515] hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
                  aria-label="Close cart"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Step Progress Strip */}
            {items.length > 0 && step !== "success" && (
              <div className="px-5 sm:px-6 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-[11px] font-semibold">
                <span className={step === "cart" ? "text-gray-900" : "text-emerald-600"}>
                  1. Review Bag
                </span>
                <span className="text-gray-300">→</span>
                <span className={step === "checkout" ? "text-gray-900" : "text-gray-400"}>
                  2. Shipping &amp; Payment
                </span>
                <span className="ml-auto text-[10px] text-gray-500 font-normal">
                  Free Pan-India Shipping
                </span>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 bg-white">
              {/* EMPTY STATE */}
              {step === "cart" && items.length === 0 && (
                <div className="text-center py-14 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-gray-900">Your Bag is Empty</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Explore our curated collection of luxury timepieces and add your signature watch.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      document.getElementById("explore-by-brand")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-2 inline-block px-7 py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-full transition shadow-md cursor-pointer"
                  >
                    Explore Collection
                  </button>
                </div>
              )}

              {/* STEP 1: CART ITEMS */}
              {step === "cart" && items.length > 0 && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] uppercase font-bold tracking-widest text-gray-500">
                        Selected Timepieces ({totalCount})
                      </h3>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-[11px] font-medium text-gray-400 hover:text-red-600 transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200/80 hover:border-gray-300 transition flex gap-3.5 items-center"
                        >
                          <div className="w-20 h-20 bg-white rounded-xl border border-gray-200/70 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-gray-400">No Image</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="inline-block text-[10px] font-bold tracking-wider text-[#996515] uppercase">
                                  {item.brand || "Luxury"}
                                </span>
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {item.name}
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                aria-label="Remove item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-200/70">
                              <PriceTag price={item.price} size="xs" theme="light" showOriginal={false} />

                              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-6 h-6 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
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
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-6 h-6 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>

                              <span className="text-sm font-bold text-gray-900">
                                ₹{fmt((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rolex OG Box Add-on (Clean White/Emerald) */}
                  {hasRolexInCart && (
                    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg shrink-0">👑</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-emerald-950">
                                Official OG Rolex Box
                              </span>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Rolex Exclusive
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-900/75 mt-0.5 leading-snug">
                              Luxury green presentation case, warranty card, wax seal tag &amp; booklet.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-1 rounded-lg whitespace-nowrap">
                          +₹{rolexBoxPrice}
                        </span>
                      </div>

                      <label className="flex items-center gap-2.5 pt-2 border-t border-emerald-200/70 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeOgRolexBox}
                          onChange={(e) => setIncludeOgRolexBox(e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-700 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-emerald-950">
                          {includeOgRolexBox ? "OG Rolex Box Included (+₹499)" : "Add OG Rolex Box for ₹499"}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Shipping Method & Promo Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-3.5 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Shipping Method
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setShippingMethod("standard")}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            shippingMethod === "standard"
                              ? "bg-white border-gray-900 ring-1 ring-gray-900 text-gray-900 shadow-xs"
                              : "bg-white/60 border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Standard</span>
                            <span className="text-emerald-600 font-bold text-[11px]">FREE</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">3–5 Days</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShippingMethod("express")}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            shippingMethod === "express"
                              ? "bg-white border-gray-900 ring-1 ring-gray-900 text-gray-900 shadow-xs"
                              : "bg-white/60 border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Express</span>
                            <span className="font-bold text-[#996515] text-[11px]">₹199</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">1–2 Days Air</p>
                        </button>
                      </div>
                    </div>

                    {/* Promo Code */}
                    <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-3.5 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Promo Code
                      </span>
                      {appliedPromo ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                          <span className="font-bold text-emerald-800">
                            {appliedPromo.code} (−₹{fmt(discountAmount)})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              removePromoCode();
                              setPromoFeedback(null);
                            }}
                            className="text-emerald-700 hover:text-red-600 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Enter code"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                            className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                      {promoFeedback && (
                        <p className={`text-[10px] font-medium ${promoFeedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                          {promoFeedback.text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({totalCount} {totalCount === 1 ? "item" : "items"})</span>
                      <span className="font-semibold text-gray-900">₹{fmt(subtotal)}</span>
                    </div>
                    {includeOgRolexBox && hasRolexInCart && (
                      <div className="flex justify-between text-emerald-700 text-xs font-medium">
                        <span>👑 OG Rolex Presentation Box</span>
                        <span>+₹{rolexBoxPrice}</span>
                      </div>
                    )}
                    {appliedPromo && (
                      <div className="flex justify-between text-emerald-700 text-xs font-medium">
                        <span>Promo Discount ({appliedPromo.code})</span>
                        <span>−₹{fmt(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className={shippingCost === 0 ? "text-emerald-600 font-semibold" : "text-gray-900 font-semibold"}>
                        {shippingCost === 0 ? "FREE" : `₹${shippingCost}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-xs">
                      <span>GST (18% Included)</span>
                      <span>₹{fmt(taxAmount)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                      <div>
                        <span className="text-base font-bold text-gray-900">Total</span>
                        <p className="text-[10px] text-gray-500">All taxes &amp; insured packaging included</p>
                      </div>
                      <PriceTag price={finalTotal} size="lg" theme="light" showOriginal={false} />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: CHECKOUT FORM */}
              {step === "checkout" && (
                <form onSubmit={handlePlaceOrder} className="space-y-5">
                  {/* Compact Total Bar */}
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-500">Order Total:</span>
                      <span className="ml-2 text-base font-bold text-gray-900">₹{fmt(finalTotal)}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 font-semibold">
                      {totalCount} {totalCount === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {/* Delivery Fields */}
                  <div className="space-y-3">
                    <h3 className="text-[11px] uppercase font-bold tracking-widest text-[#996515]">
                      1. Delivery &amp; Contact Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-900"
                        />
                        {formErrors.fullName && <p className="text-red-600 text-[10px] mt-1">{formErrors.fullName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile / WhatsApp *</label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-900"
                        />
                        {formErrors.phone && <p className="text-red-600 text-[10px] mt-1">{formErrors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Complete Address *</label>
                      <textarea
                        rows={2}
                        placeholder="House / Flat No, Street, Landmark"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-900"
                      />
                      {formErrors.address && <p className="text-red-600 text-[10px] mt-1">{formErrors.address}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="Mumbai"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">State</label>
                        <input
                          type="text"
                          placeholder="Maharashtra"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">PIN Code *</label>
                        <input
                          type="text"
                          placeholder="400001"
                          maxLength={6}
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-900"
                        />
                      </div>
                    </div>
                    {formErrors.pincode && <p className="text-red-600 text-[10px]">{formErrors.pincode}</p>}
                  </div>

                  {/* Payment Options: Instant UPI vs COD (₹300 Advance) */}
                  <div className="space-y-2.5 pt-1">
                    <h3 className="text-[11px] uppercase font-bold tracking-widest text-[#996515]">
                      2. Payment Method
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                          formData.paymentMethod === "upi"
                            ? "bg-amber-50/50 border-gray-900 ring-1 ring-gray-900"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={formData.paymentMethod === "upi"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "upi" })}
                          className="mt-0.5 accent-gray-900"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-gray-900">Instant UPI / QR</p>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Full Pay
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">GPay, PhonePe, Paytm — auto-verified</p>
                          <p className="text-xs font-bold text-gray-900 mt-1.5">Pay ₹{fmt(finalTotal)} now</p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                          formData.paymentMethod === "cod"
                            ? "bg-amber-50/50 border-gray-900 ring-1 ring-gray-900"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === "cod"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                          className="mt-0.5 accent-gray-900"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-gray-900">Cash on Delivery</p>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                              ₹{codAdvance} COD Fee
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">Pay ₹{codAdvance} UPI fee now, full bill on delivery</p>
                          <p className="text-xs font-bold text-gray-900 mt-1.5">Pay at Doorstep: ₹{fmt(codBalance)}</p>
                        </div>
                      </label>
                    </div>

                    {formData.paymentMethod === "cod" && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>COD Prepaid Fee (Pay Now via UPI)</span>
                          <span className="text-[#996515]">₹{fmt(codAdvance)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Payable at Doorstep (Full Order Amount)</span>
                          <span className="font-semibold text-gray-900">₹{fmt(codBalance)}</span>
                        </div>
                        <p className="text-[10px] text-amber-900/80 pt-1">
                          ₹{codAdvance} is a COD handling &amp; confirmation charge. The full order amount (₹{fmt(codBalance)}) is payable in cash at delivery.
                        </p>
                      </div>
                    )}
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                      {paymentError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isInitiatingPayment}
                    className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isInitiatingPayment ? (
                      <span>Launching Secure UPI Gateway...</span>
                    ) : (
                      <>
                        <span>
                          {formData.paymentMethod === "cod"
                            ? `Pay ₹${fmt(codAdvance)} COD Fee via UPI`
                            : `Pay ₹${fmt(payableNow)} via UPI`}
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: SUCCESS */}
              {step === "success" && (
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-[#996515] uppercase tracking-widest">
                      Order #{orderId}
                    </span>
                    <h3 className="text-2xl font-bold font-serif text-gray-900 mt-1">
                      Thank You For Your Order!
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                      Your UPI payment has been verified. Our concierge team is preparing your insured dispatch.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Customer</span>
                      <span className="text-gray-900 font-semibold">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Phone</span>
                      <span className="text-gray-900 font-semibold">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Paid via UPI</span>
                      <span className="text-emerald-700 font-bold">
                        ₹{fmt(confirmedSummary?.paidNow ?? payableNow)}
                      </span>
                    </div>
                    {confirmedSummary?.method === "cod" && confirmedSummary.balanceDue > 0 && (
                      <div className="flex justify-between text-gray-500 border-t border-gray-200 pt-2">
                        <span>Balance Due on Delivery (COD)</span>
                        <span className="text-gray-900 font-bold">₹{fmt(confirmedSummary.balanceDue)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {confirmedSummary?.invoice && (
                      <button
                        type="button"
                        onClick={() => downloadOrPrintInvoice(confirmedSummary.invoice)}
                        className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>📄 Download / Print Invoice (PDF)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setStep("cart");
                        setIsOpen(false);
                      }}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer CTA: Cart Step */}
            {step === "cart" && items.length > 0 && (
              <div className="px-5 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/90 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setStep("checkout")}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <span className="text-xs bg-white/15 px-2 py-0.5 rounded-md font-mono">
                    ₹{fmt(finalTotal)}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="w-full py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Order via WhatsApp Concierge</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                  <span>🔒 256-bit Encrypted UPI</span>
                  <span>⚡ COD available with ₹{COD_ADVANCE_AMOUNT} prepaid fee</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback Embedded YouPI Modal */}
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
    </>
  );
}
