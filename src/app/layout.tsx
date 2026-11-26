import type { Metadata } from 'next'
import {
  Cinzel,
  Playfair_Display,
  Montserrat,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import Script from 'next/script'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DappersFit | Premium Timepieces',
  description: 'Premium luxury watches and timepieces.',
  icons: {
    icon: '/logo-icon.png',
  },
}

import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import FloatingCartButton from "@/components/FloatingCartButton";
import NavbarCartButton from "@/components/NavbarCartButton";
import { getCurrentSession } from "@/lib/auth";
import { getWhatsAppChatUrl, DEFAULT_WHATSAPP_NUMBER } from "@/lib/whatsapp";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${cinzel.variable} ${playfair.variable} ${montserrat.variable} ${jakarta.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preload" href="/showcase.mp4?v=3" as="video" type="video/mp4" />
      </head>
      <body className="font-sans bg-gray-50 flex flex-col min-h-screen text-gray-900 antialiased">
        <CartProvider>
          {/* Top Moving Luxury Marquee Announcement Bar */}
          <a
            href="https://www.instagram.com/dappers_fit_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            className="bg-neutral-950 text-white border-b border-white/10 py-2 block overflow-hidden text-[11px] font-brand tracking-widest uppercase hover:bg-neutral-900 transition"
          >
            <div className="animate-marquee">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center gap-10 pr-10 whitespace-nowrap">
                  <span>
                    <span className="text-[#D4AF37] mr-1.5">★</span>
                    <strong className="text-[#D4AF37]">SALE IS LIVE</strong> — Luxury Timepieces at Unmatched Value
                  </span>
                  <span>
                    <span className="text-[#D4AF37] mr-1.5">⌚</span>
                    Get Branded Watches from <strong className="text-[#D4AF37]">DappersFit</strong> Now!
                  </span>
                  <span>
                    <span className="text-emerald-400 mr-1.5">⚡</span>
                    Instant UPI &amp; ₹150 COD Prepaid Available Pan-India
                  </span>
                  <span>
                    <span className="text-pink-400 mr-1.5">★</span>
                    Daily New Arrivals &amp; Unboxing on Instagram:{" "}
                    <span className="font-bold text-[#D4AF37] underline underline-offset-2">@dappers_fit_</span> →
                  </span>
                </div>
              ))}
            </div>
          </a>

          {/* Navigation */}
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="flex items-center group py-1">
                      <img
                        src="/logo.png"
                        alt="DappersFit Logo"
                        className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
                      />
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link href="/" className="border-transparent text-gray-700 hover:text-black inline-flex items-center px-1 pt-1 border-b-2 text-xs font-brand font-semibold uppercase tracking-wider">Home</Link>
                    <Link href="/#catalog" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-xs font-brand font-semibold uppercase tracking-wider">Watches</Link>
                    <Link href="/#reviews" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-xs font-brand font-semibold uppercase tracking-wider">Reviews</Link>
                    <Link href="/cart" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-xs font-brand font-semibold uppercase tracking-wider">Cart</Link>
                    <Link href="/about" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-xs font-brand font-semibold uppercase tracking-wider">About</Link>
                    <a
                      href="https://www.instagram.com/dappers_fit_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-transparent text-gray-500 hover:text-pink-600 inline-flex items-center gap-1.5 px-1 pt-1 border-b-2 text-xs font-brand font-semibold uppercase tracking-wider group"
                      title="Follow @dappers_fit_ for New Arrivals"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-pink-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      <span>Instagram</span>
                    </a>
                    {session && (
                      <Link href="/account" className="border-transparent text-gray-700 hover:text-black inline-flex items-center px-1 pt-1 border-b-2 text-xs font-brand font-semibold uppercase tracking-wider">
                        👤 My Orders
                      </Link>
                    )}
                    {session?.role === "ADMIN" && (
                      <Link href="/admin/orders" className="border-transparent text-amber-700 hover:text-black inline-flex items-center px-2 py-1 rounded-md text-xs font-brand font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 ml-4 transition">
                        👑 Admin Portal
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right Nav Action: User, Admin (on mobile) & Cart */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {session?.role === "ADMIN" && (
                    <Link
                      href="/admin/orders"
                      className="inline-flex sm:hidden items-center px-2 py-1 rounded-lg text-xs font-brand font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-xs uppercase tracking-wider"
                    >
                      👑 Admin
                    </Link>
                  )}
                  {session ? (
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-1 text-xs font-brand font-semibold text-gray-700 hover:text-black px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <span>👤 {session.name.split(" ")[0]}</span>
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center text-xs font-brand font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 px-3.5 py-1.5 rounded-full transition shadow-xs"
                    >
                      Sign In
                    </Link>
                  )}
                  <NavbarCartButton />
                </div>
              </div>
              {/* Mobile Quick Navigation Strip */}
              <div className="sm:hidden flex items-center gap-4 overflow-x-auto py-2 border-t border-gray-100 text-[11px] font-brand font-semibold uppercase tracking-wider text-gray-600 no-scrollbar">
                <Link href="/" className="whitespace-nowrap hover:text-black">Home</Link>
                <Link href="/#explore-by-brand" className="whitespace-nowrap hover:text-black">Watches</Link>
                <Link href="/#reviews" className="whitespace-nowrap hover:text-black">Reviews</Link>
                <Link href="/cart" className="whitespace-nowrap hover:text-black">Cart</Link>
                <Link href="/about" className="whitespace-nowrap hover:text-black">About</Link>
                <Link href="/request-watch" className="whitespace-nowrap text-[#996515]">Request Watch</Link>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Persistent Global Cart Drawer and Floating Pill */}
          <CartDrawer />
          <FloatingCartButton />

          {/* Official YOUPI PG Universal Integration Script */}
          <Script
            src="https://pay.dappersfit.com/youpi.js"
            data-youpi-key="yp_live_03a352119d6c1e3384b93a7403c1f23c"
            data-merchant-id="d99d66ee-1530-4c38-9872-69ecec0102a7"
            data-portal-url="https://pay.dappersfit.com"
            data-api-url="https://pay-api.dappersfit.com"
            strategy="afterInteractive"
          />

        {/* Footer */}
        <footer className="bg-black text-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              <div>
                <Link href="/" className="inline-block mb-4">
                  <img
                    src="/logo-dark.png"
                    alt="DappersFit Logo"
                    className="h-10 w-auto object-contain"
                  />
                </Link>
                <p className="text-xs font-sans text-gray-400 leading-relaxed">
                  Premium luxury watches and timepieces. We source, authenticate, and deliver excellence.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-brand font-bold uppercase tracking-widest text-[#D4AF37]">Customer Service</h3>
                <ul className="mt-4 space-y-3 text-xs font-sans">
                  <li><Link href="/contact" className="text-gray-400 hover:text-white transition">Contact Us</Link></li>
                  <li><Link href="/gift-services" className="text-gray-400 hover:text-white transition">Gift Services</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-brand font-bold uppercase tracking-widest text-[#D4AF37]">Connect</h3>
                <ul className="mt-4 space-y-3 text-xs font-sans">
                  <li>
                    <a
                      href={getWhatsAppChatUrl("Hello DappersFit! I am inquiring from your website.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 transition"
                    >
                      <span>WhatsApp: +91 93639 03915</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/dappers_fit_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-pink-400 flex items-center gap-1.5 transition group"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-pink-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      <span>Instagram: @dappers_fit_</span>
                    </a>
                  </li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Facebook</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">YouTube</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-brand font-bold uppercase tracking-widest text-[#D4AF37]">Trust Builders</h3>
                <ul className="mt-4 space-y-3 text-xs font-sans text-gray-400">
                  <li>Secure Checkout</li>
                  <li>Verified Products</li>
                  <li>Fast Shipping</li>
                </ul>
              </div>

            </div>
          </div>
        </footer>
        </CartProvider>
      </body>
    </html>
  )
}
