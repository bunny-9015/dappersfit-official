"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { BrandCategory } from "@/lib/brandUtils";

interface BrandExploreSectionProps {
  brands: BrandCategory[];
  selectedBrand: string;
  onSelectBrand: (brandName: string) => void;
}

export default function BrandExploreSection({
  brands,
  selectedBrand,
  onSelectBrand,
}: BrandExploreSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Mouse / Pointer Dragging State
  const isPointerDown = useRef(false);
  const isDragging = useRef(false);
  const pointerDownPos = useRef({ x: 0, y: 0, time: 0 });
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Drag velocity tracking for momentum
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const momentumRafId = useRef<number | null>(null);

  // Hover-to-Slide State: Smooth automatic sliding when pointer reaches the sides
  const hoverRafId = useRef<number | null>(null);
  const hoverSpeed = useRef(0);

  const stopMomentum = useCallback(() => {
    if (momentumRafId.current) {
      cancelAnimationFrame(momentumRafId.current);
      momentumRafId.current = null;
    }
  }, []);

  const stopHoverScroll = useCallback(() => {
    if (hoverRafId.current) {
      cancelAnimationFrame(hoverRafId.current);
      hoverRafId.current = null;
    }
    hoverSpeed.current = 0;
  }, []);

  // Continuous animation frame loop for hover-sliding
  const ensureHoverLoop = useCallback(() => {
    if (hoverRafId.current) return;

    const loop = () => {
      const el = carouselRef.current;
      if (el && Math.abs(hoverSpeed.current) > 0.05) {
        el.scrollLeft += hoverSpeed.current;
      }
      hoverRafId.current = requestAnimationFrame(loop);
    };
    hoverRafId.current = requestAnimationFrame(loop);
  }, []);

  // Cleanup all animation loops on unmount
  useEffect(() => {
    return () => {
      stopMomentum();
      stopHoverScroll();
    };
  }, [stopMomentum, stopHoverScroll]);

  // Fast mouse wheel horizontal translation
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
        stopMomentum();
        stopHoverScroll();
        el.scrollLeft += e.deltaY * 1.5;
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [stopMomentum, stopHoverScroll]);

  // Pointer Down: Record initial tap/press coordinates without blocking child clicks
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = carouselRef.current;
    if (!el) return;

    stopMomentum();
    stopHoverScroll();

    isPointerDown.current = true;
    isDragging.current = false;
    pointerDownPos.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    startX.current = e.clientX;
    scrollLeftStart.current = el.scrollLeft;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;

    el.style.scrollBehavior = "auto";
  };

  // Pointer Move: Distinguish between stationary tap/hover and intentional slide drag
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = carouselRef.current;
    if (!el) return;

    // CASE 1: Active mouse press
    if (isPointerDown.current) {
      stopHoverScroll();
      const currentX = e.clientX;
      const currentY = e.clientY;
      const deltaX = currentX - pointerDownPos.current.x;
      const deltaY = currentY - pointerDownPos.current.y;
      const dist = Math.hypot(deltaX, deltaY);

      // Require at least 10px movement before classifying as a drag (prevents taps being swallowed)
      if (dist > 10) {
        if (!isDragging.current) {
          isDragging.current = true;
          setIsGrabbing(true);
        }

        el.scrollLeft = scrollLeftStart.current - (currentX - startX.current) * 1.45;

        const now = performance.now();
        const dt = now - lastTime.current;
        if (dt > 6) {
          const instantV = (currentX - lastX.current) / dt;
          velocity.current = velocity.current * 0.3 + instantV * 0.7;
          lastX.current = currentX;
          lastTime.current = now;
        }
      }
      return;
    }

    // CASE 2: Pointer Hover Navigation (No pressing required!)
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;

    if (relX > 0.60) {
      const intensity = Math.min((relX - 0.60) / 0.38, 1);
      hoverSpeed.current = Math.pow(intensity, 1.25) * 15;
      ensureHoverLoop();
    } else if (relX < 0.40) {
      const intensity = Math.min((0.40 - relX) / 0.38, 1);
      hoverSpeed.current = -Math.pow(intensity, 1.25) * 15;
      ensureHoverLoop();
    } else {
      hoverSpeed.current = 0;
    }
  };

  // When pointer leaves the carousel section, smoothly stop hover-sliding
  const handlePointerLeaveCarousel = () => {
    stopHoverScroll();
  };

  // Pointer Up / Release: If dragged, coast with momentum; if tapped, allow click
  const endDrag = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsGrabbing(false);

    const el = carouselRef.current;
    if (!el) return;

    if (isDragging.current && Math.abs(velocity.current) > 0.08) {
      let currentVelocity = velocity.current * 22;
      const friction = 0.965;

      const glide = () => {
        if (!el) return;
        el.scrollLeft -= currentVelocity;
        currentVelocity *= friction;

        if (Math.abs(currentVelocity) > 0.15) {
          momentumRafId.current = requestAnimationFrame(glide);
        }
      };

      momentumRafId.current = requestAnimationFrame(glide);
    }

    // Reset isDragging after small delay so onClick can check if it was a drag
    setTimeout(() => {
      isDragging.current = false;
    }, 120);
  };

  const handleCardClick = (brandName: string) => {
    // If the user actually dragged, don't trigger click
    if (isDragging.current) return;
    onSelectBrand(brandName);
  };

  if (!brands || brands.length === 0) return null;

  return (
    <section
      id="explore-by-brand"
      className="w-full bg-white text-gray-900 pt-16 pb-12 sm:pt-20 sm:pb-16 border-t border-gray-100 relative select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs uppercase tracking-[0.35em] text-[#B52E42] font-display font-bold">
              Curated Collections
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-gray-900 tracking-tight">
              Explore by Brand
            </h2>
            <p className="text-gray-500 text-sm sm:text-base font-sans font-light max-w-xl">
              Move your pointer to the sides to slide through brands effortlessly, or drag to flick. Click any brand to open its collection.
            </p>
          </div>

          {/* Navigation Controls: Close Button & Interactive Indicator Pill */}
          <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0">
            {selectedBrand && selectedBrand !== "" && (
              <button
                type="button"
                onClick={() => onSelectBrand(selectedBrand)}
                className="text-xs font-brand font-semibold text-[#B52E42] hover:text-white border border-[#B52E42]/40 bg-red-50 hover:bg-[#B52E42] px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>Close {selectedBrand}</span>
                <span className="text-[11px] font-bold">✕</span>
              </button>
            )}

            {/* Interactive Navigation Pill Indicator */}
            <div className="hidden sm:inline-flex items-center gap-2 text-xs font-brand font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full shadow-2xs select-none">
              <svg className="w-3.5 h-3.5 text-[#B52E42] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Move pointer to sides to slide</span>
            </div>
          </div>
        </div>

        {/* Free-flowing, Hover & Drag Responsive Brand Carousel */}
        <div
          className="relative group/carousel"
          onPointerLeave={handlePointerLeaveCarousel}
        >
          {/* Subtle Left & Right Edge Vignette Indicators */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent z-10 flex items-center justify-start pl-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <span className="text-gray-400 font-bold text-sm bg-white/90 p-1 rounded-full shadow-xs">‹</span>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10 flex items-center justify-end pr-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <span className="text-gray-400 font-bold text-sm bg-white/90 p-1 rounded-full shadow-xs">›</span>
          </div>

          <div
            ref={carouselRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              touchAction: "pan-y",
              WebkitOverflowScrolling: "touch",
              transform: "translateZ(0)",
              willChange: "scroll-position",
            }}
            className={`flex gap-4 sm:gap-6 md:gap-7 overflow-x-auto py-5 px-1 select-none [&::-webkit-scrollbar]:hidden ${
              isGrabbing ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {/* Individual Brand Cards */}
            {brands.map((brand) => {
              const isSelected = Boolean(
                selectedBrand &&
                selectedBrand.toLowerCase() === brand.name.toLowerCase()
              );

              return (
                <div
                  key={brand.name}
                  onClick={() => handleCardClick(brand.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectBrand(brand.name);
                    }
                  }}
                  style={{
                    contentVisibility: "auto",
                    containIntrinsicSize: "340px 480px",
                  }}
                  className={`group shrink-0 rounded-3xl bg-white border flex flex-col overflow-hidden transform-gpu select-none cursor-pointer transition-all duration-200 ${
                    "w-[250px] xs:w-[280px] sm:w-[310px] md:w-[335px] lg:w-[355px] h-[400px] xs:h-[430px] sm:h-[460px] md:h-[480px]"
                  } ${
                    isSelected
                      ? "border-[#B52E42] ring-2 ring-[#B52E42]/50 shadow-2xl shadow-[#B52E42]/20 -translate-y-2 bg-red-50/10"
                      : "border-gray-200/90 hover:border-[#172B55] hover:shadow-2xl hover:-translate-y-2 shadow-xs"
                  }`}
                >
                  {/* Selected Pill Badge */}
                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-[#172B55] text-white border border-[#B52E42]/60 text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B52E42] animate-pulse" />
                      <span>Selected</span>
                    </div>
                  )}

                  {/* Representative Watch Image Container - Generous & Cinematic */}
                  <div className="relative flex-1 w-full bg-gradient-to-b from-gray-50/90 via-gray-100/30 to-white p-5 sm:p-7 flex items-center justify-center overflow-hidden border-b border-gray-100/80">
                    {brand.imageUrl ? (
                      <img
                        src={brand.imageUrl}
                        alt={`${brand.displayName} luxury watches`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="w-full h-full object-contain pointer-events-none select-none transform-gpu transition-transform duration-300 ease-out group-hover:scale-106"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 opacity-35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                          <path strokeLinecap="round" strokeWidth="1.5" d="M12 7v5l3 2" />
                        </svg>
                        <span className="text-xs mt-2 font-medium">Watch</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>

                  {/* Rolex-inspired Brand Information (Eyebrow + Large Title + Subtitle) */}
                  <div className="p-4 sm:p-5 text-center flex flex-col justify-between items-center space-y-1.5 bg-white">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#B52E42] font-brand font-bold">
                      Collection
                    </span>
                    <h3
                      className={`font-brand font-black uppercase text-base sm:text-lg md:text-xl tracking-wider truncate w-full transition-colors ${
                        isSelected
                          ? "text-[#172B55]"
                          : "text-gray-900 group-hover:text-black"
                      }`}
                      title={brand.displayName}
                    >
                      {brand.displayName}
                    </h3>
                    <p className="text-xs text-gray-500 font-sans font-medium">
                      {brand.count} {brand.count === 1 ? "Model" : "Models"}
                    </p>

                    {/* Accent Line */}
                    <div
                      className={`h-0.5 rounded-full transition-all duration-300 mt-1 ${
                        isSelected
                          ? "w-10 bg-[#B52E42]"
                          : "w-0 group-hover:w-8 bg-[#172B55]"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile swipe hint banner */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 pt-2 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            <svg className="w-3.5 h-3.5 animate-pulse text-[#B52E42]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>Swipe horizontally to explore brands</span>
          </div>
        </div>
      </div>
    </section>
  );
}
