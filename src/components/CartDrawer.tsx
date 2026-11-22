"use client";

import React, { useState } from "react";
import { useCart, COD_EXTRA_CHARGE, COD_ADVANCE_COLLECTION } from "@/context/CartContext";
import { createOrder } from "@/app/actions";
import PriceTag from "./PriceTag";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";
import YoupiCheckoutModal from "@/components/YoupiCheckoutModal";
import { isAutomaticWatch } from "@/lib/brandUtils";

const fmt = (val: number | string | undefined | null) => {
  const n = Number(val);
  return isNaN(n) ? "0" : n.toLocaleString("en-IN");
};

const loadYoupiSDK = (portalUrl = "http://localhost:7000"): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Youpi) return resolve(true);

    const existing = document.getElementById("youpi-sdk-script");
    if (existing) {
      if (window.Youpi) return resolve(true);
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "youpi-sdk-script";
    script.src = `${portalUrl.replace(/\/+$/, "")}/youpi.js`;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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
    paymentMethod: "cod",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  const [confirmedWhatsAppMsg, setConfirmedWhatsAppMsg] = useState<string>("");
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [sandboxOrderData, setSandboxOrderData] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
    payeeVpa?: string;
    payeeName?: string;
    upiUri?: string;
    checkoutUrl?: string;
  } | null>(null);

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

  const isCodSelected = formData.paymentMethod === "cod";
  const codChargeAmount = isCodSelected ? COD_EXTRA_CHARGE : 0;
  const effectiveShippingCost = isCodSelected ? shippingCost : 0; // Prepaid Free Ship!
  const effectiveFinalTotal = Math.max(0, subtotal - discountAmount + effectiveShippingCost + codChargeAmount);
  const balanceOnDeliveryAmount = isCodSelected ? Math.max(0, effectiveFinalTotal - COD_ADVANCE_COLLECTION) : 0;

  // WhatsApp order formatting
  const generateWhatsAppMessage = (
    currentOrderId?: string,
    payStatusText?: string,
    payRefId?: string
  ) => {
    const id = currentOrderId || `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    const isCod = formData.paymentMethod === "cod";
    const totalWithCod = Math.max(
      0,
      subtotal - discountAmount + (isCod ? shippingCost + COD_EXTRA_CHARGE : 0)
    );
    let message = `*👑 DAPPERSFIT LUXURY TIMEPIECES - ORDER #${id} 👑*\n\n`;

    message += `*📋 ORDER SUMMARY:*\n`;
    items.forEach((item, index) => {
      const brandStr = (item.brand || "Luxury").toUpperCase();
      const autoTag = isAutomaticWatch(item) ? " [⚙️ AUTOMATIC]" : "";
      message += `${index + 1}. *${brandStr}* - ${item.name || "Watch"}${autoTag}\n`;
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
    if (isCod) {
      message += `• Shipping: ${shippingCost === 0 ? "FREE Standard" : `₹${shippingCost} (Priority Air)`}\n`;
      message += `• COD Charges: +₹${COD_EXTRA_CHARGE} (Note: ₹300 COD charges)\n`;
      message += `• Taxes: GST 18% (Included)\n`;
      message += `• *TOTAL ORDER AMOUNT: ₹${fmt(totalWithCod)}*\n`;
      message += `• *COD ADVANCE COLLECTION PAID: ₹${fmt(COD_ADVANCE_COLLECTION)}*\n`;
      message += `• *BALANCE PAYABLE ON DELIVERY: ₹${fmt(Math.max(0, totalWithCod - COD_ADVANCE_COLLECTION))}*\n\n`;
    } else {
      message += `• Shipping: FREE (Prepaid Free Shipping)\n`;
      message += `• Taxes: GST 18% (Included)\n`;
      message += `• *TOTAL PREPAID AMOUNT: ₹${fmt(totalWithCod)}*\n\n`;
    }

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
          ? "Cash on Delivery (₹300 Advance Collection • Note: ₹300 COD Charges)"
          : formData.paymentMethod === "upi"
          ? "Prepaid Instant UPI / QR (Free Shipping)"
          : "Prepaid Credit/Debit Card (Free Shipping)"
      }\n`;
      if (payStatusText) {
        message += `• Payment Status: ${payStatusText}\n`;
      }
      if (payRefId) {
        message += `• Transaction ID: ${payRefId}\n`;
      }
    }

    message += `\nPlease confirm availability and dispatch schedule. Thank you!`;
    return message;
  };

  // Direct WhatsApp Inquiry (does NOT create a premature order in Admin DB)
  const handleWhatsAppOrder = () => {
    const msg = generateWhatsAppMessage(undefined, "Direct WhatsApp Concierge Inquiry");
    window.open(getWhatsAppChatUrl(msg), "_blank");
  };

  const finalizeVerifiedDrawerOrder = async (params: {
    orderNumber: string;
    paymentMethod: string;
    paymentStatus: "pending" | "paid";
    orderStatus: "Pending" | "Confirmed";
    paymentId?: string;
    payStatusLabel: string;
  }) => {
    const isCod = params.paymentMethod === "cod";
    const computedShipping = isCod ? shippingCost + COD_EXTRA_CHARGE : 0;
    const computedTotal = Math.max(0, subtotal - discountAmount + computedShipping);
    const balanceDue = isCod ? Math.max(0, computedTotal - COD_ADVANCE_COLLECTION) : 0;

    await createOrder({
      orderNumber: params.orderNumber,
      customerName: formData.fullName,
      customerPhone: formData.phone,
      shippingAddress: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      orderStatus: params.orderStatus,
      notes: isCod
        ? `COD Order (Note: ₹${COD_EXTRA_CHARGE} COD Charges Applied) | ₹${COD_ADVANCE_COLLECTION} Advance Collected via YouPI-PG (Ref: ${params.paymentId || "N/A"}) | Balance Payable on Delivery: ₹${fmt(balanceDue)}`
        : params.paymentId
        ? `Prepaid Free Shipping | YouPI-PG Direct UPI Verified (VPA: pinelabs.stq4525474@pineaxis) | Ref: ${params.paymentId}`
        : undefined,
      subtotal: subtotal,
      discountAmount: discountAmount,
      promoCode: appliedPromo?.code || undefined,
      shippingCost: computedShipping,
      shippingMethod: isCod ? "cod_advance_300" : "prepaid_free_ship",
      taxAmount: taxAmount,
      totalAmount: computedTotal,
      items: items.map((it) => ({
        productId: it.id,
        productName: it.name,
        brand: it.brand || "Luxury",
        price: it.price,
        quantity: it.quantity,
        imageUrl: it.imageUrl,
      })),
    });

    const msg = generateWhatsAppMessage(
      params.orderNumber,
      params.payStatusLabel,
      params.paymentId
    );
    setConfirmedTotal(computedTotal);
    setConfirmedWhatsAppMsg(msg);
    setOrderId(params.orderNumber);
    setPaymentId(params.paymentId || "");
    setIsProcessingPayment(false);
    setStep("success");
    clearCart();

    window.open(getWhatsAppChatUrl(msg), "_blank");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!validateForm()) return;

    const newId = orderId || `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newId);
    setIsProcessingPayment(true);

    const isCod = formData.paymentMethod === "cod";
    const chargeNow = isCod ? COD_ADVANCE_COLLECTION : effectiveFinalTotal;

    try {
      // Both Prepaid (full amount, free shipping) and COD (₹300 advance collection) verify payment first via YouPI-PG
      const apiRes = await fetch("/api/youpi/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newId,
          amount: chargeNow,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          paymentType: isCod ? "cod_advance" : "prepaid",
        }),
      });

      const orderData = await apiRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to initiate YouPI-PG online payment gateway.");
      }

      const portalUrl = orderData.portalUrl || "http://localhost:7000";
      const scriptLoaded = !orderData.isFallbackModal ? await loadYoupiSDK(portalUrl) : false;

      if (scriptLoaded && window.Youpi && orderData.checkoutUrl) {
        let settled = false;
        await window.Youpi.pay({
          orderId: newId,
          paymentId: orderData.paymentId,
          checkoutUrl: orderData.checkoutUrl,
          portalUrl,
          amount: chargeNow,
          currency: "INR",
          name: "DAPPERSFIT",
          description: isCod
            ? `COD ₹${COD_ADVANCE_COLLECTION} Advance Collection (#${newId})`
            : `Prepaid Order #${newId} (Free Shipping)`,
          handler: async (result) => {
            if (settled) return;
            const status = String(result?.status || "").toUpperCase();
            if (
              status === "SUCCESS" ||
              status === "OBSERVED_SUCCESS" ||
              status === "RECONCILED" ||
              status === "MANUAL_REVIEW"
            ) {
              settled = true;
              const verifyRes = await fetch("/api/youpi/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId: orderData.paymentId,
                  orderId: newId,
                  orderNumber: newId,
                  utr: result?.utr,
                  isDirectConfirmed: true,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success && verifyData.isPaid) {
                const refId = verifyData.utr || verifyData.paymentId || orderData.paymentId;
                await finalizeVerifiedDrawerOrder({
                  orderNumber: newId,
                  paymentMethod: isCod ? "cod" : "youpi",
                  paymentStatus: "paid",
                  orderStatus: "Confirmed",
                  paymentId: refId,
                  payStatusLabel: isCod
                    ? `COD CONFIRMED (₹${COD_ADVANCE_COLLECTION} Advance Paid via YouPI-PG • ₹${fmt(balanceOnDeliveryAmount)} Payable on Delivery)`
                    : "PREPAID PAID VIA YOUPI-PG (FREE SHIPPING)",
                });
              } else {
                setPaymentError(
                  verifyData.error || "Payment could not be verified. Please try again."
                );
                setIsProcessingPayment(false);
              }
            }
          },
          onCancelled: () => {
            if (settled) return;
            settled = true;
            setPaymentError(
              "Payment was cancelled or incomplete. Your cart items are safe — please retry payment."
            );
            setIsProcessingPayment(false);
          },
          onFailed: (result) => {
            if (settled) return;
            settled = true;
            setPaymentError(
              result?.reason ||
                "Payment verification failed. Your cart items are safe — please retry."
            );
            setIsProcessingPayment(false);
          },
          onExpired: () => {
            if (settled) return;
            settled = true;
            setPaymentError(
              "Payment session expired. Your cart items are safe — please retry."
            );
            setIsProcessingPayment(false);
          },
          onClose: async () => {
            if (settled) return;
            try {
              const verifyRes = await fetch("/api/youpi/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId: orderData.paymentId,
                  orderId: newId,
                  orderNumber: newId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success && verifyData.isPaid) {
                settled = true;
                const refId = verifyData.utr || verifyData.paymentId || orderData.paymentId;
                await finalizeVerifiedDrawerOrder({
                  orderNumber: newId,
                  paymentMethod: isCod ? "cod" : "youpi",
                  paymentStatus: "paid",
                  orderStatus: "Confirmed",
                  paymentId: refId,
                  payStatusLabel: isCod
                    ? `COD CONFIRMED (₹${COD_ADVANCE_COLLECTION} Advance Paid via YouPI-PG • ₹${fmt(balanceOnDeliveryAmount)} Payable on Delivery)`
                    : "PREPAID PAID VIA YOUPI-PG (FREE SHIPPING)",
                });
                return;
              }
            } catch {
              // Ignore
            }
            settled = true;
            setPaymentError(
              "Payment modal closed before completion. Your cart items are safe — please retry payment."
            );
            setIsProcessingPayment(false);
          },
        });
        return;
      }

      // Open built-in YouPI-PG Direct VPA QR Modal
      setIsProcessingPayment(false);
      setUtrInput("");
      setSandboxOrderData({
        orderId: orderData.paymentId || newId,
        orderNumber: newId,
        amount: chargeNow,
        payeeVpa: orderData.payeeVpa || "pinelabs.stq4525474@pineaxis",
        payeeName: orderData.payeeName || "DAPPERSFIT",
        upiUri: orderData.upiUri,
        checkoutUrl: orderData.checkoutUrl,
      });
      setShowSandboxModal(true);
    } catch (err: unknown) {
      console.error("Order processing error:", err);
      setPaymentError(
        err instanceof Error ? err.message : "An error occurred while initiating payment."
      );
      setIsProcessingPayment(false);
    }
  };

  const handleSimulateSandboxPayment = async (customUtr?: string) => {
    if (!sandboxOrderData) return;
    const finalUtr = (customUtr || utrInput || `UTR${Date.now().toString().slice(-9)}`).trim();
    if (finalUtr.length < 6) {
      setPaymentError("Please enter a valid 12-digit UPI UTR / Reference number.");
      return;
    }

    setIsProcessingPayment(true);
    const isCod = formData.paymentMethod === "cod";

    try {
      const verifyRes = await fetch("/api/youpi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: sandboxOrderData.orderId,
          orderId: sandboxOrderData.orderNumber,
          orderNumber: sandboxOrderData.orderNumber,
          utr: finalUtr,
          isDirectConfirmed: true,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success && verifyData.isPaid) {
        const pId = verifyData.utr || verifyData.paymentId || finalUtr;
        setShowSandboxModal(false);
        await finalizeVerifiedDrawerOrder({
          orderNumber: sandboxOrderData.orderNumber,
          paymentMethod: isCod ? "cod" : "youpi",
          paymentStatus: "paid",
          orderStatus: "Confirmed",
          paymentId: pId,
          payStatusLabel: isCod
            ? `COD CONFIRMED (₹${COD_ADVANCE_COLLECTION} Advance Paid via YouPI-PG • UTR: ${pId} • ₹${fmt(balanceOnDeliveryAmount)} Payable on Delivery)`
            : `PREPAID PAID VIA YOUPI-PG (UTR: ${pId} • FREE SHIPPING)`,
        });
      } else {
        setPaymentError(verifyData.error || "Payment verification failed.");
        setIsProcessingPayment(false);
      }
    } catch (err) {
      console.error("YouPI verify error:", err);
      setPaymentError("Error completing payment.");
      setIsProcessingPayment(false);
    }
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
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-block text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase">
                                      {item.brand || "Luxury"}
                                    </span>
                                    {isAutomaticWatch(item) && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-brand font-black uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#D4AF37] text-black">
                                        ⚙️ AUTOMATIC
                                      </span>
                                    )}
                                  </div>
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
                          <span>Shipping</span>
                          <span>
                            <span className="text-emerald-400 font-bold">FREE (Prepaid Free Ship)</span>
                          </span>
                        </div>

                        <div className="flex justify-between text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-lg">
                          <span>COD Option Note:</span>
                          <span className="font-bold">₹300 Advance • +₹300 COD Charges</span>
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

                    {paymentError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs">
                        ⚠ {paymentError}
                      </div>
                    )}

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
                            formData.paymentMethod === "upi"
                              ? "bg-emerald-500/15 border-emerald-400 text-white"
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
                              className="text-emerald-400 focus:ring-0"
                            />
                            <div>
                              <p className="text-xs font-bold flex items-center gap-1.5">
                                <span>Prepaid UPI (GPay / PhonePe / Paytm)</span>
                              </p>
                              <p className="text-[10px] text-emerald-300">FREE Shipping • ₹0 COD Charges</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase">
                            FREE SHIP
                          </span>
                        </label>

                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            formData.paymentMethod === "card"
                              ? "bg-emerald-500/15 border-emerald-400 text-white"
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
                              className="text-emerald-400 focus:ring-0"
                            />
                            <div>
                              <p className="text-xs font-bold">Prepaid Card / Netbanking</p>
                              <p className="text-[10px] text-emerald-300">FREE Shipping • Secure 256-bit SSL</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase">
                            FREE SHIP
                          </span>
                        </label>

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
                              <p className="text-[10px] text-amber-300 font-medium">
                                ₹300 Advance Collection • Note: ₹300 COD Charges
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/50 px-2 py-0.5 rounded font-bold uppercase">
                            +₹300 COD
                          </span>
                        </label>
                      </div>

                      {isCodSelected ? (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-[#D4AF37]/50 text-[11px] text-gray-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-[#D4AF37]">
                            <span>📌 COD ₹300 Advance Collection</span>
                            <span>Note: +₹300 COD Charges</span>
                          </div>
                          <p className="text-gray-300 leading-snug">
                            Pay <strong>₹{COD_ADVANCE_COLLECTION} advance</strong> now to book COD. Remaining balance of <strong>₹{fmt(balanceOnDeliveryAmount)}</strong> is payable in cash at delivery (Total with ₹300 COD charge: ₹{fmt(effectiveFinalTotal)}).
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold flex items-center justify-between">
                          <span>🎉 Prepaid Free Shipping Applied!</span>
                          <span>Save ₹300</span>
                        </div>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="w-full py-4 bg-[#D4AF37] hover:bg-[#b8952f] text-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessingPayment ? (
                        <span>Processing Payment...</span>
                      ) : formData.paymentMethod === "cod" ? (
                        <>
                          <span>🔒 Pay ₹{COD_ADVANCE_COLLECTION} COD Advance (Balance ₹{fmt(balanceOnDeliveryAmount)} on Delivery)</span>
                        </>
                      ) : (
                        <>
                          <span>🔒 Pay ₹{fmt(effectiveFinalTotal)} Online (Free Ship)</span>
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
                      {paymentId && (
                        <div className="flex justify-between text-gray-400">
                          <span>Payment Ref:</span>
                          <span className="text-emerald-400 font-mono font-semibold">{paymentId}</span>
                        </div>
                      )}
                      {formData.paymentMethod === "cod" && (
                        <>
                          <div className="flex justify-between text-gray-400">
                            <span>COD Advance Paid:</span>
                            <span className="text-emerald-400 font-bold">₹{COD_ADVANCE_COLLECTION}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Balance on Delivery:</span>
                            <span className="text-amber-400 font-bold">
                              ₹{fmt(Math.max(0, (confirmedTotal || effectiveFinalTotal) - COD_ADVANCE_COLLECTION))}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                        <span className="text-white">
                          {formData.paymentMethod === "cod"
                            ? "Total Order Value (incl. ₹300 COD):"
                            : "Total Prepaid (Free Ship):"}
                        </span>
                        <span className="text-[#D4AF37] text-sm">
                          ₹{fmt(confirmedTotal || effectiveFinalTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const msg =
                            confirmedWhatsAppMsg ||
                            generateWhatsAppMessage(
                              orderId,
                              paymentId ? "PAID ONLINE" : "Cash on Delivery",
                              paymentId || undefined
                            );
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
                    onClick={() => {
                      setPaymentError(null);
                      setStep("checkout");
                    }}
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
                    <span>Or Enquire via WhatsApp Directly</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>🔒 256-bit Encrypted Checkout</span>
                    <span>⚡ 100% Verified Quality</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* YouPI-PG White-Label Checkout Modal inside CartDrawer */}
          <YoupiCheckoutModal
            isOpen={showSandboxModal}
            orderData={sandboxOrderData}
            customerName={formData.fullName}
            customerPhone={formData.phone}
            isProcessing={isProcessingPayment}
            onVerifyUtr={(utr) => handleSimulateSandboxPayment(utr)}
            onClose={() => {
              setShowSandboxModal(false);
              setIsProcessingPayment(false);
              setPaymentError(
                "Payment was cancelled or incomplete. Your cart items are safe — please retry payment."
              );
            }}
          />
        </div>
      )}
    </>
  );
}
