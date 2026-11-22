"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart, COD_EXTRA_CHARGE, COD_ADVANCE_COLLECTION } from "@/context/CartContext";
import { createOrder, getUserSession } from "@/app/actions";
import PriceTag from "@/components/PriceTag";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";
import { isAutomaticWatch } from "@/lib/brandUtils";

interface YoupiPayResult {
  status?: string;
  order_id?: string;
  payment_mode?: string;
  amount_received?: number;
  utr?: string;
  reason?: string;
}

interface YoupiCheckoutOptions {
  order_id?: string;
  orderId?: string;
  amount?: number | string;
  currency?: string;
  name?: string;
  description?: string;
  paymentId?: string;
  checkoutUrl?: string;
  portalUrl?: string;
  apiUrl?: string;
  handler?: (result: YoupiPayResult) => void;
  onSuccess?: (result: YoupiPayResult) => void;
  onFailed?: (result: YoupiPayResult) => void;
  onExpired?: (result: YoupiPayResult) => void;
  onCancelled?: (result: YoupiPayResult) => void;
  onClose?: () => void;
}

interface YoupiGlobal {
  pay: (options: YoupiCheckoutOptions) => Promise<unknown>;
}

declare global {
  interface Window {
    Youpi?: YoupiGlobal;
  }
}

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
    availablePromos,
    includeOgRolexBox,
    setIncludeOgRolexBox,
    hasRolexInCart,
    rolexBoxPrice,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Checkout modal / step
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  const [confirmedWhatsAppMsg, setConfirmedWhatsAppMsg] = useState<string>("");

  // YouPI-PG Direct UPI QR Modal State
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

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "cashfree", // Default: Cashfree Online Payment
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Auto-prefill form if user is logged in
  useEffect(() => {
    async function loadUser() {
      try {
        const session = await getUserSession();
        if (session) {
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || session.name || "",
            email: prev.email || session.email || "",
          }));
        }
      } catch {
        // Non-blocking
      }
    }
    loadUser();
  }, []);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = codeToApply || promoInput;
    const res = applyPromoCode(code);
    if (res.success) {
      setPromoMessage({ type: "success", text: res.message });
      setPromoInput("");
    } else {
      setPromoMessage({ type: "error", text: res.message });
    }
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoMessage(null);
  };

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
  const payableNowAmount = isCodSelected ? COD_ADVANCE_COLLECTION : effectiveFinalTotal;
  const balanceOnDeliveryAmount = isCodSelected ? Math.max(0, effectiveFinalTotal - COD_ADVANCE_COLLECTION) : 0;

  const formatWhatsAppMessage = (id: string, payStatusText: string, payIdText?: string) => {
    const isCod = formData.paymentMethod === "cod";
    const totalWithCod = Math.max(
      0,
      subtotal - discountAmount + (isCod ? shippingCost + COD_EXTRA_CHARGE : 0)
    );
    let msg = `*👑 DAPPERSFIT LUXURY ORDER #${id} 👑*\n\n`;
    msg += `*Items:*\n`;
    items.forEach((item, idx) => {
      const autoTag = isAutomaticWatch(item) ? " [⚙️ AUTOMATIC]" : "";
      msg += `${idx + 1}. ${item.brand.toUpperCase()} - ${item.name}${autoTag} (${item.quantity} × ₹${item.price.toLocaleString("en-IN")}) = ₹${(item.quantity * item.price).toLocaleString("en-IN")}\n`;
    });
    msg += `\n*Order Breakdown:*\nSubtotal: ₹${subtotal.toLocaleString("en-IN")}\n`;
    if (includeOgRolexBox && hasRolexInCart) {
      msg += `👑 Packaging: Official OG Rolex Luxury Box (+₹${rolexBoxPrice})\n`;
    }
    if (appliedPromo) msg += `Promo (${appliedPromo.code}): -₹${discountAmount.toLocaleString("en-IN")}\n`;
    if (isCod) {
      msg += `Shipping: ${shippingCost === 0 ? "FREE Standard" : `₹${shippingCost}`}\n`;
      msg += `COD Charges: +₹${COD_EXTRA_CHARGE} (Note: ₹300 COD charges)\n`;
      msg += `GST (18%): Included in price\n`;
      msg += `*Total Order Amount: ₹${totalWithCod.toLocaleString("en-IN")}*\n`;
      msg += `*COD Advance Paid: ₹${COD_ADVANCE_COLLECTION.toLocaleString("en-IN")}*\n`;
      msg += `*Balance Payable on Delivery: ₹${Math.max(0, totalWithCod - COD_ADVANCE_COLLECTION).toLocaleString("en-IN")}*\n\n`;
    } else {
      msg += `Shipping: FREE (Prepaid Free Shipping)\n`;
      msg += `GST (18%): Included in price\n`;
      msg += `*Total Prepaid Amount: ₹${totalWithCod.toLocaleString("en-IN")}*\n\n`;
    }
    msg += `*Delivery To:* ${formData.fullName}\n`;
    msg += `*Phone:* ${formData.phone}\n`;
    if (formData.email) msg += `*Email:* ${formData.email}\n`;
    msg += `*Address:* ${formData.address}, ${formData.city || ""} - ${formData.pincode}\n`;
    msg += `*Payment Method:* ${isCod ? "Cash On Delivery (₹300 Advance Collection + ₹300 COD Charges)" : "Prepaid Online Payment (Free Shipping)"}\n`;
    msg += `*Payment Status:* ${payStatusText}\n`;
    if (payIdText) msg += `*Transaction ID:* ${payIdText}\n`;
    return msg;
  };

  // Helper to persist order in DB ONLY after Online Prepaid OR COD ₹300 Advance is verified
  const finalizeVerifiedOrderInDb = async (params: {
    orderNumber: string;
    paymentMethod: "cod" | "youpi";
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
      customerEmail: formData.email || undefined,
      shippingAddress: formData.address,
      city: formData.city || undefined,
      state: formData.state || undefined,
      pincode: formData.pincode || undefined,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      orderStatus: params.orderStatus,
      notes: isCod
        ? `COD Order (Note: ₹${COD_EXTRA_CHARGE} COD Charges Applied) | ₹${COD_ADVANCE_COLLECTION} Advance Collected via YouPI-PG (Ref: ${params.paymentId || "N/A"}) | Balance Payable on Delivery: ₹${balanceDue.toLocaleString("en-IN")}`
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

    const msg = formatWhatsAppMessage(
      params.orderNumber,
      params.payStatusLabel,
      params.paymentId
    );
    setConfirmedTotal(computedTotal);
    setConfirmedWhatsAppMsg(msg);
    setOrderId(params.orderNumber);
    if (params.paymentId) {
      setPaymentId(params.paymentId);
    } else {
      setPaymentId("");
    }
    setIsProcessingPayment(false);
    setOrderConfirmed(true);
    clearCart();

    window.open(getWhatsAppChatUrl(msg), "_blank");
  };

  // Handler for Prepaid (Full Amount, Free Ship) and COD (₹300 Advance Collection, +₹300 COD Charges) via YouPI-PG
  const handleProceedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!validateForm()) {
      return;
    }

    const newId = orderId || `DF-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newId);
    setIsProcessingPayment(true);

    const isCod = formData.paymentMethod === "cod";
    const chargeNow = isCod ? COD_ADVANCE_COLLECTION : effectiveFinalTotal;

    try {
      const apiRes = await fetch("/api/youpi/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newId,
          amount: chargeNow,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          paymentType: isCod ? "cod_advance" : "prepaid",
        }),
      });

      const orderData = await apiRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to initiate YouPI-PG payment gateway.");
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
                await finalizeVerifiedOrderInDb({
                  orderNumber: newId,
                  paymentMethod: isCod ? "cod" : "youpi",
                  paymentStatus: "paid",
                  orderStatus: "Confirmed",
                  paymentId: refId,
                  payStatusLabel: isCod
                    ? `COD CONFIRMED (₹${COD_ADVANCE_COLLECTION} Advance Paid via YouPI-PG • ₹${balanceOnDeliveryAmount.toLocaleString("en-IN")} Payable on Delivery)`
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
                await finalizeVerifiedOrderInDb({
                  orderNumber: newId,
                  paymentMethod: isCod ? "cod" : "youpi",
                  paymentStatus: "paid",
                  orderStatus: "Confirmed",
                  paymentId: refId,
                  payStatusLabel: isCod
                    ? `COD CONFIRMED (₹${COD_ADVANCE_COLLECTION} Advance Paid via YouPI-PG • ₹${balanceOnDeliveryAmount.toLocaleString("en-IN")} Payable on Delivery)`
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

      // Open built-in YouPI-PG Direct VPA QR Modal (pinelabs.stq4525474@pineaxis)
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

  // Direct YouPI-PG VPA Payment Verification (UTR / Instant Confirmation)
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
        await finalizeVerifiedOrderInDb({
          orderNumber: sandboxOrderData.orderNumber,
          paymentMethod: isCod ? "cod" : "youpi",
          paymentStatus: "paid",
          orderStatus: "Confirmed",
          paymentId: pId,
          payStatusLabel: isCod
            ? `COD CONFIRMED (₹${COD_ADVANCE_COLLECTION} Advance Paid via YouPI-PG • UTR: ${pId} • ₹${balanceOnDeliveryAmount.toLocaleString("en-IN")} Payable on Delivery)`
            : `PREPAID PAID VIA YOUPI-PG (UTR: ${pId} • FREE SHIPPING)`,
        });
      } else {
        setPaymentError(verifyData.error || "Payment verification failed.");
        setIsProcessingPayment(false);
      }
    } catch (err: unknown) {
      console.error("YouPI verify error:", err);
      setPaymentError("Error verifying YouPI-PG payment.");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb / Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <span className="text-[#D4AF37]">Shopping Cart & Checkout</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Shopping Cart & Checkout
            </h1>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-4">
              <Link
                href="/#catalog"
                className="text-xs text-gray-400 hover:text-white transition"
              >
                ← Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-xs text-gray-500 hover:text-red-400 transition"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 && !orderConfirmed && (
          <div className="text-center py-24 space-y-5 bg-neutral-950 rounded-3xl border border-white/10 max-w-2xl mx-auto p-8">
            <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white font-serif">Your Cart is Currently Empty</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto font-light">
              Explore our verified collection of luxury timepieces and select your signature watch.
            </p>
            <Link
              href="/#catalog"
              className="inline-block px-8 py-3.5 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-[#b8952f] transition shadow-lg shadow-[#D4AF37]/20"
            >
              Explore Watches
            </Link>
          </div>
        )}

        {/* Order Confirmed Screen */}
        {orderConfirmed && (
          <div className="text-center py-16 space-y-6 bg-neutral-950 rounded-3xl border border-emerald-500/30 max-w-2xl mx-auto p-8 shadow-2xl">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <span>✓ {paymentId ? "Payment Verified • Order Placed" : "Order Placed Successfully"}</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-white mt-1">
                Thank You for Your Order!
              </h2>
              <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">
                Thank you, <strong className="text-white">{formData.fullName}</strong>. Your luxury timepiece order has been recorded and scheduled for insured express dispatch.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-neutral-900/80 rounded-2xl border border-white/10 p-5 text-left text-xs space-y-3 font-mono">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Order Reference:</span>
                <span className="text-[#D4AF37] font-bold">#{orderId}</span>
              </div>
              {paymentId && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Payment Reference ID:</span>
                  <span className="text-emerald-400 font-bold">{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Payment Mode:</span>
                <span className="text-white">
                  {formData.paymentMethod === "cod"
                    ? "Cash On Delivery (₹300 Advance • +₹300 COD Charges)"
                    : "Prepaid Online (Free Shipping)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Payment Status:</span>
                <span className="text-emerald-400 font-bold">
                  {formData.paymentMethod === "cod"
                    ? "₹300 ADVANCE PAID • CONFIRMED"
                    : "PREPAID • PAID & CONFIRMED"}
                </span>
              </div>
              {formData.paymentMethod === "cod" && (
                <>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">COD Advance Paid:</span>
                    <span className="text-emerald-400 font-bold">₹{COD_ADVANCE_COLLECTION}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Balance Payable on Delivery:</span>
                    <span className="text-amber-400 font-bold">
                      ₹{Math.max(0, (confirmedTotal || effectiveFinalTotal) - COD_ADVANCE_COLLECTION).toLocaleString("en-IN")}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-gray-400">Total Order Value:</span>
                <span className="text-white font-bold text-sm">
                  ₹{(confirmedTotal || effectiveFinalTotal).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 pt-1">
                Deliver To: {formData.address}, {formData.city || ""} - {formData.pincode}
              </div>
            </div>

            {/* WhatsApp Receipt Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={getWhatsAppChatUrl(
                  confirmedWhatsAppMsg ||
                    formatWhatsAppMessage(
                      orderId,
                      paymentId ? "PAID VIA CASHFREE" : "Cash on Delivery",
                      paymentId || undefined
                    )
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>WhatsApp Order Receipt</span>
              </a>

              <Link
                href="/account"
                className="w-full sm:w-auto px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border border-white/10"
              >
                View in My Account
              </Link>

              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#D4AF37]/20"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Active Cart Layout: 2 Columns */}
        {items.length > 0 && !orderConfirmed && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Order Summary & Item List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-neutral-950 rounded-3xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-lg font-bold font-serif text-white">
                    Order Summary ({totalCount} {totalCount === 1 ? "item" : "items"})
                  </h2>
                  <span className="text-xs text-gray-400">Verified Luxury Stock</span>
                </div>

                <div className="divide-y divide-white/5 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="pt-4 first:pt-0 flex gap-4 sm:gap-6 items-center">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-neutral-900 rounded-2xl border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 group">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain transform group-hover:scale-108 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-xs text-gray-600">No Image</span>
                        )}
                      </div>

                      {/* Content & Editable Quantities */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                                {item.brand}
                              </span>
                              {isAutomaticWatch(item) && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-brand font-black uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#D4AF37] text-black border border-black shadow">
                                  ⚙️ AUTOMATIC
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-white truncate">{item.name}</h3>
                            <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <span>Price:</span>
                              <PriceTag price={item.price} size="xs" showOriginal={false} />
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-500 hover:text-red-400 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
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
                              className="w-10 text-center text-sm font-bold bg-transparent text-white focus:outline-none"
                            />
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
                              title="Increase"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">Total</span>
                            <span className="text-lg font-extrabold text-[#D4AF37]">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Form */}
              {isCheckingOut && (
                <div className="bg-neutral-950 rounded-3xl border border-[#D4AF37]/50 p-6 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                      <span className="text-[#D4AF37]">📍</span> Shipping & Payment Details
                    </h2>
                    <button
                      onClick={() => setIsCheckingOut(false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  {paymentError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs">
                      ⚠ {paymentError}
                    </div>
                  )}

                  <form onSubmit={handleProceedOrder} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                        {formErrors.fullName && (
                          <p className="text-red-400 text-[10px] mt-1">{formErrors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Mobile / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                        {formErrors.phone && (
                          <p className="text-red-400 text-[10px] mt-1">{formErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Email Address (Optional, for payment receipt)
                      </label>
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Delivery Address *
                      </label>
                      <input
                        type="text"
                        placeholder="House/Flat No., Street, Landmark"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                      {formErrors.address && (
                        <p className="text-red-400 text-[10px] mt-1">{formErrors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">State</label>
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">PIN Code *</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="PIN Code"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                    {formErrors.pincode && (
                      <p className="text-red-400 text-[10px]">{formErrors.pincode}</p>
                    )}

                    {/* Payment Gateway Options */}
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-gray-300">
                          Select Payment Method
                        </label>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          🔒 256-Bit SSL Encrypted
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Prepaid Online Payment (FREE SHIPPING) */}
                        <label
                          className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                            formData.paymentMethod === "cashfree"
                              ? "bg-gradient-to-br from-emerald-950/50 via-[#0038FF]/20 to-[#D4AF37]/10 border-emerald-400 text-white shadow-lg shadow-emerald-500/10"
                              : "bg-neutral-900 border-white/10 text-gray-400 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="pay"
                                checked={formData.paymentMethod === "cashfree"}
                                onChange={() => setFormData({ ...formData, paymentMethod: "cashfree" })}
                                className="accent-emerald-400"
                              />
                              <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  <span>Prepaid Online</span>
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                                    FREE SHIP
                                  </span>
                                </p>
                                <p className="text-[10px] text-gray-300 mt-0.5">
                                  UPI (GPay / PhonePe / Paytm), Cards & Netbanking
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/10 text-[10px]">
                            <span className="text-emerald-400 font-bold">🚚 Prepaid Free Shipping (Save ₹300)</span>
                          </div>
                        </label>

                        {/* Option 2: Cash on Delivery (₹300 Advance Collection + Note: ₹300 COD Charges) */}
                        <label
                          className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                            formData.paymentMethod === "cod"
                              ? "bg-gradient-to-br from-amber-500/20 via-neutral-900 to-transparent border-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/15"
                              : "bg-neutral-900 border-white/10 text-gray-400 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="pay"
                                checked={formData.paymentMethod === "cod"}
                                onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                                className="accent-[#D4AF37]"
                              />
                              <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  <span>Cash on Delivery (COD)</span>
                                  <span className="text-[9px] bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                                    ₹300 ADVANCE
                                  </span>
                                </p>
                                <p className="text-[10px] text-amber-200/90 mt-0.5 font-medium">
                                  Pay ₹300 advance now • Balance on delivery
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/10 text-[10px]">
                            <span className="text-amber-400 font-bold">⚠ Note: ₹300 COD charges apply</span>
                          </div>
                        </label>
                      </div>

                      {/* Highlighted Note Banner for COD vs Prepaid */}
                      {formData.paymentMethod === "cod" ? (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/50 text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-[#D4AF37]">
                            <span>📌 COD ₹300 Advance Collection Policy</span>
                            <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">
                              Note: ₹300 COD Charges
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">
                            • <strong>Note: ₹300 COD charges</strong> are added to Cash on Delivery orders.
                            <br />• <strong>₹300 Advance Collection</strong> is payable online now to confirm dispatch.
                            <br />• Remaining balance of <strong>₹{balanceOnDeliveryAmount.toLocaleString("en-IN")}</strong> is payable in cash at your doorstep upon delivery.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-300">
                          <span className="font-bold">🎉 Prepaid Free Shipping Active!</span>
                          <span className="text-[11px] font-semibold">₹0 Shipping • ₹0 COD Charges</span>
                        </div>
                      )}
                    </div>

                    {/* Submit / Proceed to Pay Button */}
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="w-full py-4 bg-[#D4AF37] hover:bg-[#b8952f] text-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessingPayment ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing Payment...</span>
                        </>
                      ) : formData.paymentMethod === "cashfree" ? (
                        <span>🔒 Pay ₹{effectiveFinalTotal.toLocaleString("en-IN")} Online (Prepaid Free Ship)</span>
                      ) : (
                        <span>🔒 Pay ₹{COD_ADVANCE_COLLECTION} COD Advance (Balance ₹{balanceOnDeliveryAmount.toLocaleString("en-IN")} on Delivery)</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Promo Codes & Cost Breakdown (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Promo Code Card */}
              <div className="bg-neutral-950 rounded-3xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Apply Promo Code
                  </h3>
                  {appliedPromo && (
                    <span className="text-xs text-emerald-400 font-semibold">Active</span>
                  )}
                </div>

                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                    <div>
                      <p className="text-sm font-bold text-emerald-300">
                        {appliedPromo.code} Applied!
                      </p>
                      <p className="text-xs text-emerald-400 mt-0.5">
                        Saved ₹{discountAmount.toLocaleString("en-IN")} ({appliedPromo.description})
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                      <button
                        onClick={() => handleApplyPromo()}
                        className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {promoMessage && (
                      <p
                        className={`text-xs ${
                          promoMessage.type === "success"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {promoMessage.text}
                      </p>
                    )}

                    <div className="pt-2">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Available Offers (Click to apply):
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availablePromos.map((promo) => (
                          <button
                            key={promo.code}
                            onClick={() => handleApplyPromo(promo.code)}
                            className="text-xs bg-neutral-900 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/50 px-3 py-1.5 rounded-full text-gray-300 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="font-bold font-mono text-[#D4AF37]">{promo.code}</span>
                            <span className="text-gray-400 text-[11px]">
                              ({promo.type === "percent" ? `${promo.value}% OFF` : `₹${promo.value} OFF`})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Rolex Exclusive Packaging Option */}
              {hasRolexInCart && (
                <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-950/60 rounded-3xl border border-emerald-500/40 p-6 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-0.5">👑</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-wide">
                            Official OG Rolex Luxury Presentation Box
                          </h3>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            Rolex Exclusive
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          Official green leatherette presentation box with gold Rolex crown, warranty card, seal tag & authenticity guide.
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 font-tech whitespace-nowrap bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-xl">
                      +₹{rolexBoxPrice}
                    </span>
                  </div>

                  <label className="flex items-center gap-3 pt-2 border-t border-emerald-500/20 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={includeOgRolexBox}
                      onChange={(e) => setIncludeOgRolexBox(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/50 bg-black/60 border-white/20 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition">
                      {includeOgRolexBox ? "✓ OG Rolex Box Included (+₹499)" : "Add OG Rolex Box (+₹499)"}
                    </span>
                  </label>
                </div>
              )}

              {/* Shipping Method Option */}
              <div className="bg-neutral-950 rounded-3xl border border-white/10 p-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Select Shipping
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => setShippingMethod("standard")}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      shippingMethod === "standard"
                        ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                        : "bg-neutral-900 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Standard Delivery</span>
                      <span className="text-emerald-400 font-bold">FREE</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">3-5 Days Pan-India Express</p>
                  </button>

                  <button
                    onClick={() => setShippingMethod("express")}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      shippingMethod === "express"
                        ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                        : "bg-neutral-900 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Priority Air</span>
                      <span className="font-bold text-[#D4AF37]">₹199</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">1-2 Days Fast Delivery</p>
                  </button>
                </div>
              </div>

              {/* Cost Breakdown Card */}
              <div className="bg-neutral-950 rounded-3xl border border-white/10 p-6 space-y-5 shadow-xl">
                <h2 className="text-lg font-bold font-serif text-white border-b border-white/10 pb-4">
                  Cost Breakdown
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({totalCount} items)</span>
                    <span className="font-semibold text-white">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {includeOgRolexBox && hasRolexInCart && (
                    <div className="flex justify-between text-emerald-400 font-medium text-xs bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-xl">
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
                      <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span>
                      {!isCodSelected || shippingCost === 0 ? (
                        <span className="text-emerald-400 font-bold">FREE (Prepaid Free Ship)</span>
                      ) : (
                        <span className="text-white font-medium">₹{shippingCost}</span>
                      )}
                    </span>
                  </div>

                  {isCodSelected && (
                    <div className="flex justify-between text-amber-400 font-semibold text-xs bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl">
                      <span>Note: ₹300 COD Charges</span>
                      <span className="font-tech font-bold">+₹{COD_EXTRA_CHARGE}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Taxes (GST 18%)</span>
                    <span>Included in price (₹{taxAmount.toLocaleString("en-IN")})</span>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex justify-between items-baseline">
                    <div>
                      <span className="text-lg font-bold text-white">Total Order Cost</span>
                      <p className="text-xs text-gray-400">
                        {isCodSelected ? "Includes ₹300 COD charges" : "Prepaid Free Shipping applied"}
                      </p>
                    </div>
                    <PriceTag price={effectiveFinalTotal} size="xl" showOriginal={false} />
                  </div>

                  {isCodSelected && (
                    <div className="p-3.5 rounded-2xl bg-neutral-900 border border-[#D4AF37]/40 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[#D4AF37] font-bold">
                        <span>COD Advance Collection (Pay Now):</span>
                        <span className="text-sm font-tech">₹{payableNowAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-300 pt-1 border-t border-white/10">
                        <span>Balance Payable on Delivery:</span>
                        <span className="font-bold text-white font-tech">₹{balanceOnDeliveryAmount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="text-center py-2 px-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
                      🎉 Total Discount Savings: ₹{discountAmount.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>

                {/* Primary Proceed to Checkout Button */}
                {!isCheckingOut && (
                  <button
                    onClick={() => {
                      setIsCheckingOut(true);
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="w-full py-4 bg-[#D4AF37] hover:bg-[#b8952f] text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl transition shadow-xl shadow-[#D4AF37]/30 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 text-center text-[11px] text-gray-500">
                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-white/5">
                    <span>🔒 Cashfree 256-bit Secure</span>
                  </div>
                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-white/5">
                    <span>📦 100% Insured Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* YOUPI-PG DIRECT VPA QR CHECKOUT MODAL */}
      {showSandboxModal && sandboxOrderData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-[#D4AF37]/60 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                    YouPI-PG Direct UPI Gateway
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif text-white">
                  Scan & Pay via UPI
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSandboxModal(false);
                  setIsProcessingPayment(false);
                  setPaymentError(
                    "Payment was cancelled or incomplete. Your cart items are safe — please retry payment."
                  );
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* QR Code & VPA Card */}
            <div className="bg-white rounded-2xl p-4 text-center space-y-3 text-gray-900">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Payee: <span className="text-black">{sandboxOrderData.payeeName || "DAPPERSFIT"}</span>
              </div>
              {sandboxOrderData.upiUri && (
                <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl border border-gray-200 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      sandboxOrderData.upiUri
                    )}`}
                    alt="DAPPERSFIT UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="text-[11px] font-mono bg-gray-100 px-3 py-1.5 rounded-lg text-gray-800 break-all">
                VPA: <strong>{sandboxOrderData.payeeVpa || "pinelabs.stq4525474@pineaxis"}</strong>
              </div>
              {sandboxOrderData.upiUri && (
                <a
                  href={sandboxOrderData.upiUri}
                  className="inline-block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Open UPI App (GPay / PhonePe / Paytm)
                </a>
              )}
            </div>

            {/* Order Details */}
            <div className="bg-neutral-900 rounded-2xl p-4 border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Order Ref:</span>
                <span className="text-white font-bold">#{sandboxOrderData.orderNumber}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5 text-sm">
                <span className="text-gray-300">Amount Payable Now:</span>
                <span className="text-[#D4AF37] font-bold">₹{sandboxOrderData.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* UTR Verification Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-gray-300 font-semibold mb-1">
                  Enter 12-Digit UPI UTR / Reference No. after paying:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 432187654321"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                onClick={() => handleSimulateSandboxPayment(utrInput)}
                disabled={isProcessingPayment}
                className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-[#b8952f] hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>✓ Verify UPI Payment & Confirm Order</span>
              </button>

              <button
                onClick={() => {
                  setShowSandboxModal(false);
                  setIsProcessingPayment(false);
                  setPaymentError(
                    "Payment was cancelled or incomplete. Your cart items are safe — please retry payment."
                  );
                }}
                className="w-full py-2 text-xs text-gray-400 hover:text-white transition"
              >
                Cancel / Go Back (Do Not Complete Payment)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
