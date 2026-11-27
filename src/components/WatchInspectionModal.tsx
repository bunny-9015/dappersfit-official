"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ProductData } from "./CatalogSection";
import { useCart } from "@/context/CartContext";
import PriceTag from "./PriceTag";
import { openWhatsAppEnquiry, getWhatsAppChatUrl, formatWatchEnquiryMessage } from "@/lib/whatsapp";

const fmt = (val: number | string | undefined | null) => {
  const n = Number(val);
  return isNaN(n) ? "0" : n.toLocaleString("en-IN");
};

interface WatchInspectionModalProps {
  product: ProductData | null;
  onClose: () => void;
}

export default function WatchInspectionModal({
  product,
  onClose,
}: WatchInspectionModalProps) {
  const {
    addToCart,
    setIsOpen,
    includeOgRolexBox,
    setIncludeOgRolexBox,
    rolexBoxPrice,
  } = useCart();

  const isRolex = Boolean(
    (product?.brand || "").toLowerCase().includes("rolex") ||
    (product?.name || "").toLowerCase().includes("rolex")
  );

  const displayPrice =
    product && isRolex && includeOgRolexBox
      ? product.price + (rolexBoxPrice || 499)
      : product?.price || 0;

  // Zoom states: 1 = normal, 2 = dial close-up, 3.2 = ultra macro loupe
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [transformOrigin, setTransformOrigin] = useState<string>("50% 50%");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"specs" | "delivery" | "authenticity">("specs");
  const [addedToast, setAddedToast] = useState<boolean>(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  const galleryImages = Array.from(
    new Set([product?.imageUrl, ...(product?.images || [])].filter(Boolean) as string[])
  );
  const activeImageSrc = galleryImages[activeImageIdx] || product?.imageUrl || null;

  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Reset zoom whenever product changes
  useEffect(() => {
    setZoomLevel(1);
    setTransformOrigin("50% 50%");
    setActiveTab("specs");
    setAddedToast(false);
    setActiveImageIdx(0);
  }, [product]);

  if (!product) return null;

  // Handle Mouse Move for luxury loupe effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1 || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setTransformOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  // Handle Touch Move for mobile zoom pan
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1 || !imageContainerRef.current || e.touches.length === 0) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
    setTransformOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  // Toggle zoom on click
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel === 1) {
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setTransformOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
      }
      setZoomLevel(2.2);
    } else if (zoomLevel === 2.2) {
      setZoomLevel(3.2);
    } else {
      setZoomLevel(1);
      setTransformOrigin("50% 50%");
    }
  };

  const zoomIn = () => {
    setZoomLevel((prev) => (prev >= 3.2 ? 3.2 : prev === 1 ? 2 : 3.2));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => (prev <= 1 ? 1 : prev === 3.2 ? 2 : 1));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setTransformOrigin("50% 50%");
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      brand: product.brand,
      imageUrl: product.imageUrl,
    });
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      setIsOpen(true);
      onClose();
    }, 600);
  };

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      brand: product.brand,
      imageUrl: product.imageUrl,
    });
    setIsOpen(true);
    onClose();
  };

  const handleWhatsAppInquiry = () => {
    if (!product) return;
    openWhatsAppEnquiry({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
    });
  };

  const whatsappUrl = product
    ? getWhatsAppChatUrl(
        formatWatchEnquiryMessage({
          id: product.id,
          name:
            isRolex && includeOgRolexBox
              ? `${product.name} (with OG Rolex Presentation Box)`
              : product.name,
          brand: product.brand,
          price: displayPrice,
          imageUrl: product.imageUrl,
        }) +
          (isRolex && includeOgRolexBox
            ? "\n👑 *Packaging Option:* OG Rolex Presentation Box Selected (+₹499)"
            : "")
      )
    : "#";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      {/* Click backdrop to close */}
      <div className="fixed inset-0 bg-transparent" onClick={onClose} />

      {/* Main Container */}
      <div
        className={`relative z-10 w-full bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row transition-all duration-300 ${
          isFullscreen
            ? "max-w-7xl h-[95vh]"
            : "max-w-6xl max-h-[92vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Action Controls */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-gray-100 text-gray-700 hover:text-black border border-gray-200 flex items-center justify-center transition shadow-md cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0m-5 0l0 5M15 9l5-5m0 0l-5 0m5 0l0 5M9 15l-5 5m0 0l5 0m-5 0l0-5M15 15l5 5m0 0l-5 0m5 0l0-5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 flex items-center justify-center transition shadow-md cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* LEFT COLUMN: INTERACTIVE ZOOM CHAMBER */}
        <div className="w-full lg:w-7/12 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Top Brand Pill & Loupe Status */}
          <div className="p-4 sm:p-5 flex items-center justify-between z-20">
            <span className="text-xs uppercase tracking-[0.25em] font-brand font-bold text-[#996515] bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs">
              {product.brand} • Inspection Loupe
            </span>

            {zoomLevel > 1 && (
              <span className="text-xs font-tech font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
                🔍 {zoomLevel.toFixed(1)}x Zoom Active
              </span>
            )}
          </div>

          {/* Interactive Zoomable Image Area */}
          <div
            ref={imageContainerRef}
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className={`flex-1 w-full flex items-center justify-center p-6 sm:p-10 relative overflow-hidden ${
              zoomLevel > 1 ? "cursor-crosshair" : "cursor-zoom-in"
            }`}
            style={{ minHeight: "360px" }}
          >
            {activeImageSrc ? (
              <div
                className="w-full h-full max-h-[500px] flex items-center justify-center transition-transform duration-150 ease-out will-change-transform transform-gpu"
                style={{
                  transform: `scale(${zoomLevel}) translateZ(0)`,
                  transformOrigin: transformOrigin,
                  willChange: "transform",
                }}
              >
                <img
                  src={activeImageSrc}
                  alt={product.name}
                  decoding="async"
                  className="max-w-full max-h-[480px] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)] filter brightness-[1.02] contrast-[1.05]"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm">
                <span>No High-Resolution Photo Available</span>
              </div>
            )}
          </div>

          {/* Multi-Angle Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="px-4 py-2.5 bg-white/90 border-t border-gray-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar z-20">
              {galleryImages.map((imgSrc, idx) => (
                <button
                  key={`${idx}-${imgSrc.slice(0, 24)}`}
                  type="button"
                  onClick={() => {
                    setActiveImageIdx(idx);
                    setZoomLevel(1);
                  }}
                  className={`w-14 h-14 rounded-xl bg-gray-50 border p-1 shrink-0 flex items-center justify-center cursor-pointer transition ${
                    idx === activeImageIdx
                      ? "border-gray-900 ring-1 ring-gray-900"
                      : "border-gray-200 hover:border-gray-400 opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={imgSrc} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Zoom Controls Bar at Bottom of Image */}
          <div className="p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoomLevel <= 1}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-gray-800 border border-gray-200 transition flex items-center gap-1 cursor-pointer"
                title="Zoom Out"
              >
                <span>−</span> <span>Zoom Out</span>
              </button>

              <button
                type="button"
                onClick={zoomIn}
                disabled={zoomLevel >= 3.2}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-gray-800 border border-gray-200 transition flex items-center gap-1 cursor-pointer"
                title="Zoom In"
              >
                <span>+</span> <span>Zoom In</span>
              </button>

              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={resetZoom}
                  className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#996515] border border-[#D4AF37]/40 text-xs font-bold transition cursor-pointer"
                >
                  ⟲ Reset
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-500 font-normal flex items-center gap-1.5">
              <span>💡</span>
              <span className="hidden sm:inline">
                {zoomLevel === 1
                  ? "Click on dial to zoom in • Pan around to inspect hands & markers"
                  : "Move cursor or drag to inspect dial craftsmanship"}
              </span>
              <span className="sm:hidden">
                {zoomLevel === 1 ? "Tap to zoom dial" : "Drag to inspect"}
              </span>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: HOROLOGICAL DETAILS & PURCHASE */}
        <div className="w-full lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6 bg-white text-gray-900">
          {/* Top Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-brand font-black tracking-widest text-[#996515] sm:text-[#b8860b] uppercase">
                  {product.brand}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  In Stock • Dispatch in 24h
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mt-1 leading-tight">
                {product.name}
              </h2>
              {/automatic/i.test(`${product.name} ${product.description || ""}`) && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest shadow-sm">
                    ⚙ AUTOMATIC MOVEMENT
                  </span>
                </div>
              )}
            </div>

            {/* Price Box */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Guaranteed Best Price</span>
                <PriceTag price={displayPrice} theme="light" size="xl" showOriginal={true} showBadge={true} />
                {isRolex && includeOgRolexBox && (
                  <span className="inline-block mt-1 text-[11px] font-brand font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Includes OG Rolex Box (+₹499)
                  </span>
                )}
              </div>
              <div className="text-right text-[11px] text-gray-500 space-y-0.5">
                <span className="block text-emerald-600 font-semibold">✓ Free Express Air Delivery</span>
                <span className="block">All Taxes & GST Included</span>
                <span className="block">Cash on Delivery Eligible</span>
              </div>
            </div>

            {/* Interactive Tabs: Specs | Delivery | Authenticity */}
            <div className="border-b border-gray-200 flex gap-4 text-xs font-brand">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`pb-2.5 font-bold tracking-wider uppercase transition cursor-pointer border-b-2 ${
                  activeTab === "specs"
                    ? "border-[#996515] text-[#996515]"
                    : "border-transparent text-gray-400 hover:text-gray-800"
                }`}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("delivery")}
                className={`pb-2.5 font-bold tracking-wider uppercase transition cursor-pointer border-b-2 ${
                  activeTab === "delivery"
                    ? "border-[#996515] text-[#996515]"
                    : "border-transparent text-gray-400 hover:text-gray-800"
                }`}
              >
                Shipping & Box
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("authenticity")}
                className={`pb-2.5 font-bold tracking-wider uppercase transition cursor-pointer border-b-2 ${
                  activeTab === "authenticity"
                    ? "border-[#996515] text-[#996515]"
                    : "border-transparent text-gray-400 hover:text-gray-800"
                }`}
              >
                Quality Promise
              </button>
            </div>

            {/* Tab 1: Horological Specifications */}
            {activeTab === "specs" && (
              <div className="space-y-2.5 text-xs">
                <p className="text-gray-600 leading-relaxed font-light mb-3">
                  {product.description ||
                    `An exquisite luxury timepiece from ${product.brand}, precision-assembled with high-grade components for an unmatched horological presence.`}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase block font-medium">Movement</span>
                    <span className="font-semibold text-gray-800">Kinetic Precision Quartz</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase block font-medium">Glass / Crystal</span>
                    <span className="font-semibold text-gray-800">Sapphire Coated Scratch-Proof</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase block font-medium">Case Diameter</span>
                    <span className="font-semibold text-gray-800">42mm - 44mm 316L Steel</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase block font-medium">Water Resistance</span>
                    <span className="font-semibold text-gray-800">30M / 3 ATM Splash Proof</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase block font-medium">Strap / Clasp</span>
                    <span className="font-semibold text-gray-800">Solid Link Oyster Deployment</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase block font-medium">Wrist Feel</span>
                    <span className="font-semibold text-gray-800">Substantial Heavy Weight</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Shipping & Unboxing */}
            {activeTab === "delivery" && (
              <div className="space-y-3 text-xs text-gray-700">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <span className="text-[#996515] font-bold block">📦 What's Inside The Box</span>
                  <p className="text-[11px] text-gray-600">
                    • 1x {product.brand} Luxury Timepiece
                    <br />• Premium Presentation Display Box
                    <br />• Microfiber Ultra-Soft Polishing Cloth
                    <br />• Inspection Verification Card
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <span className="text-[#996515] font-bold block">✈️ Pan-India Express Delivery</span>
                  <p className="text-[11px] text-gray-600">
                    Dispatched within 24 hours via BlueDart / Delhivery Express. Safe tamper-proof transit packaging.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Quality & Authenticity */}
            {activeTab === "authenticity" && (
              <div className="space-y-3 text-xs text-gray-700">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-emerald-700 font-bold block">✓ 100% Quality Inspected</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Every timepiece undergoes a rigorous mechanical and aesthetic inspection prior to packaging, ensuring flawless bezel alignment, date wheel transitions, and water seals.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[#996515] font-bold block">🛡️ 7-Day Doorstep Assurance</span>
                  <p className="text-[11px] text-gray-600">
                    Receive your order with complete confidence. Inspect upon arrival before finalizing your joy.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Option for OG Rolex Box (Exclusive to Rolex Watches Only) */}
          {isRolex && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 rounded-2xl border-2 border-emerald-400/80 shadow-xs transition-all">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeOgRolexBox}
                  onChange={(e) => setIncludeOgRolexBox(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-brand font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>👑</span>
                      <span>Add OG Rolex Luxury Presentation Box</span>
                    </span>
                    <span className="text-xs font-tech font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                      +₹499
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 font-sans mt-0.5 leading-relaxed">
                    Official Rolex green presentation display box with gold crown stamp, velvet watch cushion, booklet & seal card.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-gray-200">
            {addedToast && (
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-700 animate-pulse">
                ✓ Added to bag! Opening cart...
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                className="py-3.5 px-4 bg-[#172B55] hover:bg-[#102044] text-white font-brand font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#172B55]/50 active:scale-95"
              >
                <svg className="w-4 h-4 text-[#D4AF37] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Add to Bag</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="py-3.5 px-4 bg-[#B52E42] hover:bg-[#922337] text-white font-brand font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md shadow-[#B52E42]/20 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B52E42]/50"
              >
                <span>Buy Now</span>
                <svg className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-brand font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer no-underline"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Enquire on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
