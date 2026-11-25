"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/app/actions";
import PriceTag from "./PriceTag";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";
import YoupiModal from "@/components/YoupiModal";

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
    taxAmount,
    finalTotal,
    toastMessage,
    clearToast,
    includeOgRolexBox,
    setIncludeOgRolexBox,
    hasRolexInCart,
    rolexBoxPrice,
  } = useCart();

  // Checkout step: 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");

  // Customer delivery details
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "upi", // Default: Instant UPI with Pine Labs VPA
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
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Validate checkout form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.phone.trim() || formData.phone.length < 10) {
      errors.phone = "Valid 10-digit phone number is required";
    }
    if (!formData.address.trim()) errors.address = "Delivery address is required";
    if (!formData.pincode.trim() || formData.pincode.length < 6) {
      errors.pincode = "Valid 6-digit PIN code is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // WhatsApp order formatting
  const generateWhatsAppMessage = (currentOrderId?: string) => {
    const id = currentOrderId || `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    let message = `*👑 DAPPERSFIT LUXURY TIMEPIECES - ORDER #${id} 👑*\n\n`;

    message += `*📋 ORDER SUMMARY:*\n`;
    items.forEach((item, index) => {
      const brandStr = (item.brand || "Luxury").toUpperCase();
      message += `${index + 1}. *${brandStr}* - ${item.name || "Watch"}\n`;
      message += `   Qty: ${item.quantity || 1} × ₹${fmt(item.price)}\n`;
      message += `   Item Total: ₹${fmt((item.quantity || 1) * (item.price || 0))}\n`;
    });

    message += `\n*💰 COST BREAKDOWN:*\n`;
    message += `• Subtotal: ₹${fmt(subtotal)}\n`;
    if (includeOgRolexBox && hasRolexInCart) {
      message += `• Packaging: 👑 Official OG Rolex Presentation Box (+₹${rolexBoxPrice})\n`;
    }
    if (appliedPromo) {
      message += `• Promo Code (${appliedPromo.code}): -₹${fmt(discountAmount)}\n`;
    }
    message += `• Shipping: ${shippingCost === 0 ? "FREE Standard" : `₹${shippingCost} (Priority Air)`}\n`;
    message += `• Taxes: GST 18% (Included)\n`;
    message += `• *TOTAL PAYABLE: ₹${fmt(finalTotal)}*\n\n`;

    if (formData.fullName || formData.phone || formData.address) {
      message += `*📍 DELIVERY DETAILS:*\n`;
      if (formData.fullName) message += `• Name: ${formData.fullName}\n`;
      if (formData.phone) message += `• Phone: ${formData.phone}\n`;
      if (formData.address) message += `• Address: ${formData.address}\n`;
      if (formData.city || formData.state || formData.pincode) {
        message += `• Location: ${formData.city} ${formData.state} - ${formData.pincode}\n`;
      }
      message += `• Payment Choice: ${
        formData.paymentMethod === "cod"
          ? "Cash on Delivery (COD)"
          : formData.paymentMethod === "upi"
          ? "Instant UPI / QR"
          : "Credit/Debit Card"
      }\n`;
    }

    message += `\nPlease confirm availability and dispatch schedule. Thank you!`;
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
        paymentMethod: formData.paymentMethod || "cod",
        subtotal: subtotal,
        discountAmount: discountAmount,
        promoCode: appliedPromo?.code || undefined,
        shippingCost: shippingCost,
        shippingMethod: shippingMethod,
        taxAmount: taxAmount,
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
    } catch (err) {
      console.error("Order save err:", err);
    }
    const msg = generateWhatsAppMessage(id);
    window.open(getWhatsAppChatUrl(msg), "_blank");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!validateForm()) return;

    const newId = `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newId);

    // 1. If UPI selected, open YouPI Payment Gateway (NO popup blockers, NO premature success)
    if (formData.paymentMethod === "upi") {
      setIsInitiatingPayment(true);
      try {
        // Save order in database/system
        try {
          await createOrder({
            orderNumber: newId,
            customerName: formData.fullName,
            customerPhone: formData.phone,
            shippingAddress: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            paymentMethod: "youpi_upi",
            paymentStatus: "pending",
            subtotal: subtotal,
            discountAmount: discountAmount,
            promoCode: appliedPromo?.code || undefined,
            shippingCost: shippingCost,
            shippingMethod: shippingMethod,
            taxAmount: taxAmount,
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
          // DB non-blocking
        }

        const youpiRes = await fetch("/api/youpi/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newId,
            amount: finalTotal,
            customerName: formData.fullName,
            customerPhone: formData.phone,
          }),
        });
        const youpiData = await youpiRes.json();
        if (youpiData.success) {
          setConfirmedTotal(finalTotal);

          // 1. Check if official Youpi browser SDK is loaded
          const win = typeof window !== "undefined" ? (window as any) : null;
          if (win && win.Youpi && typeof win.Youpi.pay === "function") {
            try {
              await win.Youpi.pay({
                order_id: newId,
                paymentId: youpiData.sessionId || youpiData.paymentId,
                checkoutUrl: youpiData.checkoutUrl,
                amount: finalTotal,
                currency: "INR",
                customer: {
                  name: formData.fullName,
                  phone: formData.phone,
                },
                portalUrl: "https://pay.dappersfit.com",
                handler: function (response: any) {
                  handleYoupiPaymentSuccess(response.paymentId || response.utr || "youpi_verified");
                },
                onFailed: function (response: any) {
                  setPaymentError(response?.reason || "Payment was not successful. Please retry.");
                },
              });
              setIsInitiatingPayment(false);
              return;
            } catch (payErr) {
              console.warn("Youpi.pay fallback to embedded modal:", payErr);
            }
          }

          // 2. Fallback to embedded modal if SDK not yet available
          setYoupiOrderData({
            orderNumber: newId,
            amount: finalTotal,
            upiUri: youpiData.upiUri,
            payeeVpa: youpiData.payeeVpa || "kamathamlokesh9015@dbs",
            payeeName: youpiData.payeeName || "Dappersfit",
          });
          setShowYoupiModal(true);
          setIsInitiatingPayment(false);
          return;
        } else {
          setPaymentError(youpiData.error || "Unable to launch UPI gateway. Please try again.");
        }
      } catch (err: any) {
        console.error("YouPI init error:", err);
        setPaymentError("Could not connect to payment server. Please ensure server is running.");
      }
      setIsInitiatingPayment(false);
      return;
    }

    // 2. Cash on Delivery (COD)
    try {
      await createOrder({
        orderNumber: newId,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        paymentMethod: "cod",
        paymentStatus: "pending",
        subtotal: subtotal,
        discountAmount: discountAmount,
        promoCode: appliedPromo?.code || undefined,
        shippingCost: shippingCost,
        shippingMethod: shippingMethod,
        taxAmount: taxAmount,
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

    setConfirmedTotal(finalTotal);
    setStep("success");
    clearCart();
  };

  // Listen to official YOUPI PG browser CustomEvents
  useEffect(() => {
    const handleSuccess = (e: any) => {
      const { order_id, utr } = e?.detail || {};
      handleYoupiPaymentSuccess(utr || order_id || "youpi_verified");
    };

    const handleFailed = (e: any) => {
      const reason = e?.detail?.reason || "Payment was not completed.";
      setPaymentError(reason);
    };

    window.addEventListener("youpi:payment:success", handleSuccess);
    window.addEventListener("youpi:payment:observed", handleSuccess);
    window.addEventListener("youpi:payment:failed", handleFailed);
    return () => {
      window.removeEventListener("youpi:payment:success", handleSuccess);
      window.removeEventListener("youpi:payment:observed", handleSuccess);
      window.removeEventListener("youpi:payment:failed", handleFailed);
    };
  }, []);

  const handleYoupiPaymentSuccess = (paymentId: string) => {
    setShowYoupiModal(false);
    setConfirmedTotal(youpiOrderData?.amount || finalTotal);
    setStep("success");
    clearCart();
  };

  return (
    <>
      {/* Global Floating Toast Notification when adding items */}
      {toastMessage && !isOpen && (
        <div className="fixed top-20 right-4 sm:right-6 z-[95] animate-bounce">
          <div className="bg-neutral-900 border border-[#D4AF37] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <span className="text-emerald-400 font-bold">✓</span>
            <p className="text-xs font-semibold">{toastMessage}</p>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="ml-2 bg-[#D4AF37] hover:bg-[#b8952f] text-black text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer transition"
            >
              View Cart
            </button>
            <button
              type="button"
              onClick={clearToast}
              className="text-gray-400 hover:text-white text-xs ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-lg bg-neutral-950 text-white border-l border-white/10 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center space-x-3">
                  <span className="p-2.5 bg-[#D4AF37]/15 text-[#D4AF37] rounded-xl border border-[#D4AF37]/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-lg font-bold font-serif tracking-tight">
                      {step === "cart" && "Shopping Cart"}
                      {step === "checkout" && "Secure Checkout"}
                      {step === "success" && "Order Confirmed"}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {step === "cart" && `${totalCount} ${totalCount === 1 ? "timepiece" : "timepieces"} selected`}
                      {step === "checkout" && "Step 2 of 2: Shipping & Payment"}
                      {step === "success" && "Thank you for your order"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {step === "checkout" && (
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="text-xs text-[#D4AF37] hover:underline px-2 py-1 rounded transition cursor-pointer"
                    >
                      ← Back to Cart
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition cursor-pointer"
                    aria-label="Close cart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* VIEW 1: CART EMPTY */}
                {step === "cart" && items.length === 0 && (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Your Shopping Cart is Empty</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto font-light leading-relaxed">
                      Discover our exclusive collection of luxury timepieces and select your signature watch.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        const catalogEl = document.getElementById("catalog");
                        if (catalogEl) {
                          catalogEl.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="mt-3 inline-block px-7 py-3 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-[#b8952f] transition shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                    >
                      Explore Collection
                    </button>
                  </div>
                )}

                {/* VIEW 2: CART ACTIVE WITH ITEMS */}
                {step === "cart" && items.length > 0 && (
                  <>
                    {/* 1. ORDER SUMMARY */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400">
                          Order Summary ({totalCount} items)
                        </h3>
                        <button
                          type="button"
                          onClick={clearCart}
                          className="text-[11px] text-gray-500 hover:text-red-400 transition cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 bg-neutral-900/90 rounded-2xl border border-white/10 hover:border-white/20 transition flex gap-3.5 items-center"
                          >
                            {/* Item Thumbnail */}
                            <div className="w-20 h-20 bg-neutral-950 rounded-xl border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 group">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-contain transform group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <span className="text-[10px] text-gray-600">No Image</span>
                              )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="inline-block text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase">
                                    {item.brand || "Luxury"}
                                  </span>
                                  <h4 className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[220px]">
                                    {item.name}
                                  </h4>
                                </div>
                                {/* Remove item button */}
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
                                  title="Remove item"
                                  aria-label="Remove item"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              {/* Individual price & editable quantities */}
                              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                                <div className="text-xs flex items-center gap-1.5">
                                  <span className="text-gray-400">Unit:</span>
                                  <PriceTag price={item.price} size="xs" showOriginal={false} />
                                </div>

                                {/* Editable Quantity Controls */}
                                <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/20 text-white flex items-center justify-center text-xs transition cursor-pointer"
                                    title="Decrease"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (!isNaN(val)) setQuantity(item.id, val);
                                    }}
                                    className="w-8 text-center text-xs font-bold bg-transparent text-white focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/20 text-white flex items-center justify-center text-xs transition cursor-pointer"
                                    title="Increase"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Subtotal for this item */}
                                <span className="text-sm font-bold text-[#D4AF37]">
                                  ₹{fmt((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. ROLEX EXCLUSIVE PACKAGING OPTION */}
                    {hasRolexInCart && (
                      <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-950/60 rounded-2xl border border-emerald-500/40 p-4 space-y-3 shadow-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="text-xl shrink-0 mt-0.5">👑</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white tracking-wide">
                                  Official OG Rolex Box
                                </span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                  Rolex Exclusive
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-300 mt-1 leading-snug">
                                Luxury green presentation case, authentic warranty card, wax seal tag & booklet.
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 font-tech whitespace-nowrap bg-emerald-950/70 border border-emerald-500/40 px-2 py-1 rounded-lg">
                            +₹{rolexBoxPrice}
                          </span>
                        </div>

                        <label className="flex items-center gap-2.5 pt-1.5 border-t border-emerald-500/20 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            checked={includeOgRolexBox}
                            onChange={(e) => setIncludeOgRolexBox(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/50 bg-black/60 border-white/20 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition">
                            {includeOgRolexBox ? "✓ OG Rolex Box Included (+₹499)" : "Add OG Rolex Box for ₹499"}
                          </span>
                        </label>
                      </div>
                    )}

                    {/* 3. ESTIMATED SHIPPING METHOD */}
                    <div className="bg-neutral-900/60 rounded-2xl border border-white/10 p-4 space-y-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Shipping Method
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setShippingMethod("standard")}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            shippingMethod === "standard"
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                              : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Standard</span>
                            <span className="text-emerald-400 font-bold">FREE</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">3-5 Days Pan-India</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShippingMethod("express")}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            shippingMethod === "express"
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                              : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Express Air</span>
                            <span className="font-bold text-[#D4AF37]">₹199</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">1-2 Days Priority</p>
                        </button>
                      </div>
                    </div>

                    {/* 4. COST BREAKDOWN */}
                    <div className="bg-neutral-900/80 rounded-2xl border border-white/10 p-5 space-y-3">
                      <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400">
                        Cost Breakdown
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300">
                          <span>Subtotal ({totalCount} items)</span>
                          <span className="font-medium text-white">
                            ₹{fmt(subtotal)}
                          </span>
                        </div>

                        {includeOgRolexBox && hasRolexInCart && (
                          <div className="flex justify-between text-emerald-400 font-medium text-xs bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
                            <span className="flex items-center gap-1.5">
                              <span>👑</span>
                              <span>OG Rolex Presentation Box</span>
                            </span>
                            <span className="font-tech font-bold">+₹{rolexBoxPrice}</span>
                          </div>
                        )}

                        {appliedPromo && (
                          <div className="flex justify-between text-emerald-400 font-medium">
                            <span>Promo Discount ({appliedPromo.code})</span>
                            <span>- ₹{fmt(discountAmount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-gray-300">
                          <span>Estimated Shipping</span>
                          <span>
                            {shippingCost === 0 ? (
                              <span className="text-emerald-400 font-medium">FREE</span>
                            ) : (
                              <span className="text-white font-medium">₹{shippingCost}</span>
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-400 text-xs">
                          <span>Estimated Taxes (GST 18%)</span>
                          <span>Included (₹{fmt(taxAmount)})</span>
                        </div>

                        <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                          <div>
                            <span className="text-base font-bold text-white">Total Cost</span>
                            <p className="text-[10px] text-gray-400">All taxes & duties included</p>
                          </div>
                          <PriceTag price={finalTotal} size="lg" showOriginal={false} />
                        </div>

                        {discountAmount > 0 && (
                          <div className="mt-2 text-center py-1.5 px-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
                            🎉 Total Savings: ₹{fmt(discountAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* VIEW 3: CHECKOUT STEP */}
                {step === "checkout" && (
                  <form onSubmit={handlePlaceOrder} className="space-y-5">
                    {/* Collapsed order summary badge */}
                    <div className="p-3.5 bg-neutral-900 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-400">Total to Pay:</span>
                        <span className="ml-2 text-base font-bold text-[#D4AF37]">
                          ₹{fmt(finalTotal)}
                        </span>
                        {includeOgRolexBox && hasRolexInCart && (
                          <span className="ml-2 text-[10px] text-emerald-400 font-medium">
                            (+OG Rolex Box)
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400">
                        {totalCount} item{totalCount > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">
                        1. Shipping & Contact Information
                      </h3>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                        {formErrors.fullName && (
                          <p className="text-red-400 text-[10px] mt-1">{formErrors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Mobile / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                        {formErrors.phone && (
                          <p className="text-red-400 text-[10px] mt-1">{formErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Complete Delivery Address *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="House / Flat No, Street, Landmark"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                        {formErrors.address && (
                          <p className="text-red-400 text-[10px] mt-1">{formErrors.address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Mumbai"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            placeholder="Maharashtra"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1">
                            PIN Code *
                          </label>
                          <input
                            type="text"
                            placeholder="400001"
                            maxLength={6}
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                      {formErrors.pincode && (
                        <p className="text-red-400 text-[10px]">{formErrors.pincode}</p>
                      )}
                    </div>

                    {/* Payment Selection */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">
                        2. Payment Option
                      </h3>
                      <div className="space-y-2">
                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            formData.paymentMethod === "cod"
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                              : "bg-neutral-900 border-white/10 text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={formData.paymentMethod === "cod"}
                              onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                              className="text-[#D4AF37] focus:ring-0"
                            />
                            <div>
                              <p className="text-xs font-bold">Cash on Delivery (COD)</p>
                              <p className="text-[10px] text-gray-400">Pay cash upon doorstep delivery</p>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-400 font-semibold">Verified</span>
                        </label>

                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            formData.paymentMethod === "upi"
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                              : "bg-neutral-900 border-white/10 text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="upi"
                              checked={formData.paymentMethod === "upi"}
                              onChange={() => setFormData({ ...formData, paymentMethod: "upi" })}
                              className="text-[#D4AF37] focus:ring-0"
                            />
                            <div>
                              <p className="text-xs font-bold">UPI / GPay / PhonePe / Paytm</p>
                              <p className="text-[10px] text-gray-400">Instant QR code on confirmation</p>
                            </div>
                          </div>
                          <span className="text-xs text-[#D4AF37] font-semibold">Fastest</span>
                        </label>

                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            formData.paymentMethod === "card"
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                              : "bg-neutral-900 border-white/10 text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="card"
                              checked={formData.paymentMethod === "card"}
                              onChange={() => setFormData({ ...formData, paymentMethod: "card" })}
                              className="text-[#D4AF37] focus:ring-0"
                            />
                            <div>
                              <p className="text-xs font-bold">Debit / Credit Card / Netbanking</p>
                              <p className="text-[10px] text-gray-400">Secure SSL 256-bit payment</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">Encrypted</span>
                        </label>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs rounded-xl">
                        {paymentError}
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isInitiatingPayment}
                      className="w-full py-4 bg-[#D4AF37] hover:bg-[#b8952f] text-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isInitiatingPayment ? (
                        <span>Launching UPI Gateway...</span>
                      ) : (
                        <>
                          <span>{formData.paymentMethod === "upi" ? "Scan & Pay with UPI" : "Confirm Order"} (₹{fmt(finalTotal)})</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* VIEW 4: ORDER SUCCESS */}
                {step === "success" && (
                  <div className="text-center py-12 space-y-5">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest">
                        Order Reference: {orderId}
                      </span>
                      <h3 className="text-2xl font-bold font-serif text-white mt-1">
                        Thank You For Your Order!
                      </h3>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto mt-2 leading-relaxed">
                        Your luxury order has been registered. Our concierge team is preparing your dispatch verification.
                      </p>
                    </div>

                    <div className="p-4 bg-neutral-900 rounded-2xl border border-white/10 text-left space-y-2 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>Customer:</span>
                        <span className="text-white font-medium">{formData.fullName}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Contact:</span>
                        <span className="text-white font-medium">{formData.phone}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Shipping To:</span>
                        <span className="text-white font-medium truncate max-w-[200px]">
                          {formData.address}, {formData.city} - {formData.pincode}
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                        <span className="text-white">Amount Paid / COD:</span>
                        <span className="text-[#D4AF37] text-sm">₹{fmt(confirmedTotal || finalTotal)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateWhatsAppMessage(orderId);
                          window.open(getWhatsAppChatUrl(msg), "_blank");
                        }}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <span>Send Order to WhatsApp Concierge</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep("cart");
                          setIsOpen(false);
                        }}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition cursor-pointer"
                      >
                        Continue Browsing Timepieces
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer CTA: Cart View */}
              {step === "cart" && items.length > 0 && (
                <div className="p-5 sm:p-6 border-t border-white/10 bg-black/80 backdrop-blur-md space-y-3">
                  {/* Primary "Proceed to Checkout" Button */}
                  <button
                    type="button"
                    onClick={() => setStep("checkout")}
                    className="w-full py-4 bg-[#D4AF37] hover:bg-[#b8952f] text-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition shadow-xl shadow-[#D4AF37]/25 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <span className="text-xs bg-black/15 px-2 py-0.5 rounded-md font-mono">
                      ₹{fmt(finalTotal)}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  {/* Instant WhatsApp alternative */}
                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 font-semibold text-xs tracking-wide rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current text-emerald-400" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>Or Order via WhatsApp Directly</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>🔒 256-bit Encrypted Checkout</span>
                    <span>⚡ 100% Verified Quality</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* YouPI Payment Gateway Modal */}
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
