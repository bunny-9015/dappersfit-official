"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import WatchInspectionModal from "./WatchInspectionModal";
import PriceTag from "./PriceTag";
import BrandExploreSection from "./BrandExploreSection";
import { deriveBrandCategories, formatBrandDisplayName, isAutomaticWatch } from "@/lib/brandUtils";
import { getWhatsAppChatUrl, formatWatchEnquiryMessage } from "@/lib/whatsapp";

export interface ProductData {
  id: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  imageUrl: string | null;
  inStock: boolean;
  quantity: number;
  categoryId: string;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
}

interface CatalogSectionProps {
  products: ProductData[];
  categories?: CategoryData[];
  initialBrand?: string;
}

export default function CatalogSection({
  products,
  initialBrand = "",
}: CatalogSectionProps) {
  const { addToCart, setIsOpen } = useCart();

  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [quickViewProduct, setQuickViewProduct] = useState<ProductData | null>(null);

  // Progressive rendering for buttery 60fps/120fps scrolling
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  // Derive full brand categories with representative photos for brand slider
  const brandCategories = useMemo(() => {
    return deriveBrandCategories(products);
  }, [products]);

  // Handle brand selection from brand slider: clicking opens catalog, clicking same brand toggles closed
  const handleBrandSelect = (brandName: string, shouldScroll = true) => {
    const nextBrand = (brandName && brandName.toLowerCase() === selectedBrand.toLowerCase()) ? "" : brandName;
    setSelectedBrand(nextBrand);
    setSearchQuery(""); // Clear search so all models of this brand are immediately visible

    // Sync URL search params
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (!nextBrand) {
        url.searchParams.delete("brand");
      } else {
        url.searchParams.set("brand", nextBrand);
      }
      window.history.replaceState(null, "", url.toString());
    }

    if (shouldScroll && nextBrand) {
      let attempts = 0;
      const tryScroll = () => {
        const gridElem = document.getElementById("catalog-grid");
        if (gridElem) {
          const navOffset = 80;
          const elemPos = gridElem.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elemPos - navOffset,
            behavior: "smooth",
          });
        } else if (attempts < 6) {
          attempts++;
          setTimeout(tryScroll, 50);
        }
      };
      setTimeout(tryScroll, 40);
    } else if (!nextBrand && shouldScroll) {
      const exploreElem = document.getElementById("explore-by-brand");
      if (exploreElem) {
        exploreElem.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Sync initial brand from URL or initialBrand prop
  useEffect(() => {
    const brandToSync = initialBrand !== "" ? initialBrand : (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("brand") : null);
    if (brandToSync && brandToSync.toLowerCase() !== "all") {
      const match = products.find((p) => p.brand.toLowerCase() === brandToSync.toLowerCase());
      if (match) {
        setSelectedBrand(match.brand);
      } else {
        setSelectedBrand("");
      }
    } else {
      setSelectedBrand("");
    }
  }, [initialBrand, products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!selectedBrand) return [];
    return products
      .filter((p) => {
        const matchesBrand = p.brand.toLowerCase() === selectedBrand.toLowerCase();
        const matchesSearch =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesBrand && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return 0;
      });
  }, [products, selectedBrand, searchQuery, sortBy]);

  // Reset pagination when search/brand/sort changes
  React.useEffect(() => {
    setVisibleCount(24);
  }, [selectedBrand, searchQuery, sortBy]);

  // High-performance auto-loader when scrolling near bottom
  React.useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 16, filteredProducts.length));
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredProducts.length]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleAddToCart = (product: ProductData, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addToCart(
      {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      1
    );
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setIsOpen(true);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleBuyNow = (product: ProductData, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addToCart(
      {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      1
    );
    setIsOpen(true);
  };

  return (
    <div id="catalog" className="scroll-mt-16">
      {/* 1. Explore by Brand: Horizontally Swipeable Brand Category Carousel */}
      <BrandExploreSection
        brands={brandCategories}
        selectedBrand={selectedBrand}
        onSelectBrand={handleBrandSelect}
      />

      {/* 2. Brand Catalog: Only displayed when a brand is selected! */}
      {selectedBrand ? (
        <section id="catalog-grid" className="w-full bg-white text-gray-900 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-100 scroll-mt-20 animate-in fade-in duration-300">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* Top Navigation Bar: Back to Brands / Close Button */}
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
              <button
                type="button"
                onClick={() => handleBrandSelect(selectedBrand, true)}
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-[#B52E42] bg-gray-50 hover:bg-red-50/60 border border-gray-200 hover:border-[#B52E42]/40 px-4 py-2 rounded-full transition-all duration-200 shadow-2xs cursor-pointer group"
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Brand Selection</span>
              </button>

              <button
                type="button"
                onClick={() => handleBrandSelect(selectedBrand, true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black px-3 py-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                title="Close catalog"
              >
                <span>Close</span>
                <span className="text-sm font-bold">✕</span>
              </button>
            </div>

            {/* Dynamic Brand Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200/60 text-[#B52E42] text-xs font-brand font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B52E42] animate-pulse" />
                <span>
                  {`${formatBrandDisplayName(selectedBrand)} Collection`}
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-gray-900 tracking-tight">
                {`${formatBrandDisplayName(selectedBrand)} Timepieces`}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto font-sans font-normal">
                {`Explore all ${filteredProducts.length} verified ${formatBrandDisplayName(selectedBrand)} luxury models available in stock for immediate insured express dispatch.`}
              </p>
            </div>

            {/* Search Bar & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between max-w-4xl mx-auto">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder={`Search ${formatBrandDisplayName(selectedBrand)} models...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#172B55] focus:bg-white shadow-xs transition"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-black text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-xs text-gray-500 uppercase tracking-wider hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "featured" | "price-asc" | "price-desc")
                  }
                  className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#172B55] cursor-pointer shadow-xs"
                >
                  <option value="featured">Featured / Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Product Count & Close Indicator */}
            <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-200 pb-4">
              <span>
                Showing <strong className="text-gray-900">{filteredProducts.length}</strong> models in {formatBrandDisplayName(selectedBrand)}
              </span>

              <button
                onClick={() => handleBrandSelect(selectedBrand, true)}
                className="text-[#B52E42] hover:text-[#922337] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Close {formatBrandDisplayName(selectedBrand)}</span>
                <span className="text-xs">✕</span>
              </button>
            </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">No watches match your search</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search keywords.</p>
            <button
              onClick={() => {
                setSearchQuery("");
              }}
              className="px-6 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-full hover:bg-black transition cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleProducts.map((product) => {
                const isAdded = !!addedIds[product.id];
                const isAutomatic = isAutomaticWatch(product);
                return (
                  <div
                    key={product.id}
                    onClick={() => setQuickViewProduct(product)}
                    className={`group relative bg-white rounded-2xl border overflow-hidden flex flex-col transition-[transform,border-color,box-shadow] duration-200 ease-out cursor-pointer transform hover:-translate-y-1 transform-gpu will-change-transform product-card-perf ${
                      isAutomatic
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-lg hover:shadow-2xl"
                        : "border-gray-200 hover:border-gray-400 hover:shadow-xl shadow-xs"
                    }`}
                  >
                    {/* Image Container: Clean light background so watch photos blend seamlessly */}
                    <div className="relative aspect-square w-full bg-gray-50 p-6 flex items-center justify-center overflow-hidden border-b border-gray-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300 transform-gpu will-change-transform"
                          style={{
                            transform: "translate3d(0, 0, 0)",
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-xs text-center">
                          <span>Luxury Timepiece</span>
                        </div>
                      )}

                      {/* Highlighted AUTOMATIC Tag Badge */}
                      {isAutomatic && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-brand font-black uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#D4AF37] text-black border-2 border-black/80 shadow-lg shadow-[#D4AF37]/40 animate-pulse">
                            <span>⚙️</span>
                            <span>AUTOMATIC</span>
                          </span>
                        </div>
                      )}

                      {/* Hover Zoom & Inspection Indicator */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                        <span className="bg-white/95 text-gray-900 border border-gray-200 text-[10px] sm:text-[11px] font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <svg className="w-3.5 h-3.5 text-[#996515]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                          <span>Click to Zoom & Inspect</span>
                        </span>
                      </div>

                      {/* Stock Tag */}
                      <div className="absolute top-3 right-3">
                        {product.inStock ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Pre-Order
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-brand font-extrabold uppercase tracking-widest text-[#996515] sm:text-[#b8860b]">
                            {product.brand}
                          </span>
                          {isAutomatic && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-brand font-black uppercase tracking-wider bg-black text-[#D4AF37] border border-[#D4AF37]">
                              AUTOMATIC
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-sans font-bold text-gray-900 group-hover:text-black line-clamp-1 mt-0.5">
                          {product.name}
                        </h3>
                        <p className="text-xs font-sans text-gray-500 line-clamp-1 mt-1 font-normal">
                          {product.description}
                        </p>
                      </div>

                      {/* Price & Action Buttons */}
                      <div className="pt-3 border-t border-gray-100 space-y-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <PriceTag price={product.price} theme="light" size="md" showOriginal={true} showBadge={true} />
                          <span className="text-[10px] font-sans text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 font-bold">
                            Prepaid Free Ship
                          </span>
                        </div>

                        <div
                          className="space-y-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(product, e)}
                              className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl text-xs font-brand font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#172B55]/50 ${
                                isAdded
                                  ? "bg-emerald-600 text-white"
                                  : "bg-[#172B55] hover:bg-[#102044] text-white active:scale-95"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Added!</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                  <span className="truncate">Add to Cart</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleBuyNow(product, e)}
                              className="w-full py-2.5 px-2.5 sm:px-3 rounded-xl text-xs font-brand font-bold uppercase tracking-wider bg-[#B52E42] hover:bg-[#922337] text-white transition-all duration-200 shadow-xs flex items-center justify-center gap-1 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B52E42]/50"
                            >
                              <span className="truncate">Buy Now</span>
                              <svg className="w-3 h-3 text-[#D4AF37] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </button>
                          </div>

                          <a
                            href={getWhatsAppChatUrl(
                              formatWatchEnquiryMessage({
                                id: product.id,
                                name: product.name,
                                brand: product.brand,
                                price: product.price,
                                imageUrl: product.imageUrl,
                              })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="w-full py-2 px-3 rounded-xl text-xs font-brand font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] no-underline"
                          >
                            <svg className="w-3.5 h-3.5 fill-current text-[#25D366] shrink-0" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                            <span>Enquire on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Sentinel & Button */}
            {visibleCount < filteredProducts.length && (
              <div ref={loadMoreRef} className="pt-10 text-center space-y-3">
                <p className="text-xs text-gray-500">
                  Showing <strong className="text-[#996515]">{visibleProducts.length}</strong> of{" "}
                  <strong className="text-gray-900">{filteredProducts.length}</strong> watches
                </p>
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 24, filteredProducts.length))}
                  className="px-8 py-3 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition transform hover:scale-105 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Load More Watches ({filteredProducts.length - visibleProducts.length} remaining)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  ) : null}

  {/* Luxury Watch Inspection & Interactive Zoom Loupe Modal */}
  <WatchInspectionModal
    product={quickViewProduct}
    onClose={() => setQuickViewProduct(null)}
  />
</div>
  );
}
