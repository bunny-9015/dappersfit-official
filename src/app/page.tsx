import prisma from "@/lib/prisma";
import HeroVideo from "@/components/HeroVideo";
import CatalogSection from "@/components/CatalogSection";
import CustomerReviewsSection from "@/components/CustomerReviewsSection";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ brand?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialBrand = resolvedParams?.brand || "";

  let categories: any[] = [];
  let products: any[] = [];

  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database query error on homepage, activating resilient fallback:", error);
    try {
      const seedData = require("../../prisma/supabase_seed_data.json");
      categories = seedData.categories || [];
      products = seedData.products || [];
    } catch (e) {
      console.error("Failed to load fallback catalog:", e);
    }
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen scroll-smooth">
      {/* 1. Full Cinematic Video Hero Banner */}
      <section className="relative w-full h-[88vh] sm:h-[92vh] flex flex-col justify-center items-center text-center overflow-hidden py-16 px-4">
        {/* Background Video with programmatic autoplay and hardware acceleration */}
        <HeroVideo />

        {/* Subtle cinematic gradient overlays */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/25 to-black/55 pointer-events-none"
          style={{ transform: "translateZ(0)" }}
        />

        {/* Center Headline */}
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <span className="inline-block text-xs sm:text-sm uppercase tracking-[0.35em] text-[#D4AF37] font-display font-semibold mb-4 px-4 py-1.5 rounded-full border border-[#D4AF37]/35 bg-black/50 backdrop-blur-sm">
            Horological Excellence
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-white leading-tight drop-shadow-2xl">
            Time, <span className="italic font-light text-gray-200">Redefined.</span>
          </h1>
          <p className="mt-4 text-gray-200 text-sm sm:text-lg max-w-2xl mx-auto font-sans font-light leading-relaxed drop-shadow">
            Precision crafted luxury timepieces made for those who value time and distinction.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#explore-by-brand"
              className="px-7 py-3.5 bg-white text-gray-900 hover:bg-gray-100 font-brand font-bold text-xs uppercase tracking-widest rounded-full shadow-xl transition active:scale-95"
            >
              Explore Collection
            </a>
            <a
              href="/request-watch"
              className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md font-brand font-semibold text-xs uppercase tracking-widest rounded-full transition active:scale-95"
            >
              Source a Rare Model
            </a>
          </div>
        </div>
      </section>

      {/* 2. Trust Builders Bar */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center text-center gap-1.5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
              <span className="w-8 h-8 rounded-full bg-amber-50 text-[#996515] border border-amber-200/70 flex items-center justify-center text-sm font-bold">✓</span>
              <span className="text-gray-900 font-brand font-bold text-xs tracking-wider uppercase">100% Verified Quality</span>
              <span className="text-[11px] text-gray-500 font-sans">Multi-point QC inspection</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
              <span className="w-8 h-8 rounded-full bg-amber-50 text-[#996515] border border-amber-200/70 flex items-center justify-center text-sm font-bold">⚡</span>
              <span className="text-gray-900 font-brand font-bold text-xs tracking-wider uppercase">Instant UPI &amp; ₹150 COD</span>
              <span className="text-[11px] text-gray-500 font-sans">Auto-verified secure checkout</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
              <span className="w-8 h-8 rounded-full bg-amber-50 text-[#996515] border border-amber-200/70 flex items-center justify-center text-sm font-bold">✈</span>
              <span className="text-gray-900 font-brand font-bold text-xs tracking-wider uppercase">Pan-India Express</span>
              <span className="text-[11px] text-gray-500 font-sans">Insured doorstep delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
              <span className="w-8 h-8 rounded-full bg-amber-50 text-[#996515] border border-amber-200/70 flex items-center justify-center text-sm font-bold">★</span>
              <span className="text-gray-900 font-brand font-bold text-xs tracking-wider uppercase">Personal Concierge</span>
              <span className="text-[11px] text-gray-500 font-sans">Direct WhatsApp support</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. All-in-One Catalog with Integrated Cart right on this page */}
      <CatalogSection
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          description: p.description,
          imageUrl: p.imageUrl,
          images: Array.isArray(p.images) ? p.images : [],
          inStock: p.inStock,
          quantity: p.quantity,
          categoryId: p.categoryId,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.imageUrl || null,
        }))}
        initialBrand={initialBrand}
      />

      {/* 4. Our Trusted Customers' Video Reviews */}
      <CustomerReviewsSection />

      {/* 5. Luxury Concierge Banner */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs uppercase tracking-[0.35em] text-[#996515] font-display font-bold">
            Personal Concierge
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight">
            Looking for a Specific Rare Model?
          </h2>
          <p className="text-gray-600 text-sm max-w-xl mx-auto font-sans font-normal leading-relaxed">
            Can’t find what you’re looking for? Reach out to our watch sourcing team directly on WhatsApp with your reference number or photo.
          </p>
          <a
            href={getWhatsAppChatUrl("Hi DappersFit! I am looking for a specific watch model.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-brand font-bold text-xs uppercase tracking-wider rounded-full shadow-lg transition active:scale-95"
          >
            <span>Chat on WhatsApp</span>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
