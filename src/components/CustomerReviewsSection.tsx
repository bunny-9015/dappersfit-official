"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface ReviewItem {
  id: string;
  reelId: string;
  videoSrc: string;
  title: string;
  customerName: string;
  location: string;
  tag: string;
  fullUrl: string;
  watchModel?: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    reelId: "DYO33_iPwGE",
    videoSrc: "/reviews/DYO33_iPwGE.mp4",
    title: "Rolex Submariner Ceramic Bezel Unboxing",
    customerName: "Rahul Sharma",
    location: "Mumbai",
    tag: "Authentic Weight & Sweep",
    fullUrl: "https://www.instagram.com/reel/DYO33_iPwGE/?mdxt=eTc4ZW1mc2ZnZHRk",
    watchModel: "Rolex Submariner Date",
  },
  {
    id: "rev-2",
    reelId: "Db8LRXPOvL0",
    videoSrc: "/reviews/Db8LRXPOvL0.mp4",
    title: "Audemars Piguet Royal Oak Chronograph",
    customerName: "Vikram Malhotra",
    location: "Bengaluru",
    tag: "Flawless Dial Craftsmanship",
    fullUrl: "https://www.instagram.com/reel/Db8LRXPOvL0/?xtok=MWdrbHQzMWtqdXEycw==",
    watchModel: "Audemars Piguet Royal Oak",
  },
  {
    id: "rev-3",
    reelId: "DSUOr7hD-RF",
    videoSrc: "/reviews/DSUOr7hD-RF.mp4",
    title: "Patek Philippe Nautilus Luxury Wrist-Shot",
    customerName: "Aditya Verma",
    location: "Delhi NCR",
    tag: "Verified COD Delivery",
    fullUrl: "https://www.instagram.com/reel/DSUOr7hD-RF/?psln=NjcyMzFxNjNybWZj",
    watchModel: "Patek Philippe Nautilus",
  },
  {
    id: "rev-4",
    reelId: "DUatiKiEwfP",
    videoSrc: "/reviews/DUatiKiEwfP.mp4",
    title: "Richard Mille RM 35-02 Carbon Inspection",
    customerName: "Karthik R.",
    location: "Hyderabad",
    tag: "Super Clone Movement",
    fullUrl: "https://www.instagram.com/reel/DUatiKiEwfP/?mdxt=MXQ0dXFhejQwZHhxZQ==",
    watchModel: "Richard Mille RM 35-02",
  },
  {
    id: "rev-5",
    reelId: "DXEiN58CTuM",
    videoSrc: "/reviews/DXEiN58CTuM.mp4",
    title: "Hublot Big Bang Unboxing & Loupe Review",
    customerName: "Anand Patel",
    location: "Ahmedabad",
    tag: "Premium Heavy Feel",
    fullUrl: "https://www.instagram.com/reel/DXEiN58CTuM/?xtok=MXlyaGl2bnVhYTZh",
    watchModel: "Hublot Big Bang",
  },
  {
    id: "rev-6",
    reelId: "DVD5YZijxcZ",
    videoSrc: "/reviews/DVD5YZijxcZ.mp4",
    title: "Omega Speedmaster Moonwatch On-Wrist",
    customerName: "Sanjay Singhal",
    location: "Chennai",
    tag: "100% Recommended Seller",
    fullUrl: "https://www.instagram.com/reel/DVD5YZijxcZ/?dlrf=MWY4b3BmdzVtNnhrdg==",
    watchModel: "Omega Speedmaster",
  },
];

interface ReviewVideoCardProps {
  review: ReviewItem;
  activeAudioId: string | null;
  onToggleAudio: (id: string) => void;
  isVisible: boolean;
}

function ReviewVideoCard({
  review,
  activeAudioId,
  onToggleAudio,
  isVisible,
}: ReviewVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const isAudioActive = activeAudioId === review.id;

  // Sync mute state with activeAudioId
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isAudioActive) {
      video.muted = false;
      video.volume = 1.0;
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.muted = true;
    }
  }, [isAudioActive]);

  // Ensure continuous looping playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible]);

  // Handle time update for smooth loop progress indicator
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const currentProg = (video.currentTime / video.duration) * 100;
    setProgress(currentProg);
  };

  // Toggle Play / Pause
  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Toggle Audio
  const handleAudioButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleAudio(review.id);
  };

  return (
    <div className="group bg-neutral-900/95 rounded-3xl border border-white/10 hover:border-[#D4AF37]/50 shadow-xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-[#D4AF37]/10 transform-gpu">
      {/* 1. Card Top: Customer & Verification Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between gap-3 bg-neutral-950/70">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black font-brand font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md">
            {review.customerName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-brand font-bold text-xs text-white truncate">
                {review.customerName}
              </span>
              <span
                className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center font-bold"
                title="Verified Client"
              >
                ✓
              </span>
            </div>
            <p className="text-[10px] font-sans text-gray-400 truncate">
              {review.location} • <span className="text-emerald-400 font-medium">Verified Buyer</span>
            </p>
          </div>
        </div>

        <span className="text-[10px] font-tech bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
          {review.tag}
        </span>
      </div>

      {/* 2. Card Middle: Continuous Playing Video Container */}
      <div
        onClick={handleTogglePlay}
        className="relative w-full aspect-[9/14] sm:aspect-[9/15] bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none group/video"
      >
        <video
          ref={videoRef}
          src={review.videoSrc}
          autoPlay
          loop
          muted={!isAudioActive}
          playsInline
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            const video = videoRef.current;
            if (video) video.play().catch(() => {});
          }}
          className="w-full h-full object-cover pointer-events-none transform-gpu group-hover/video:scale-[1.02] transition-transform duration-300"
        />

        {/* Top Floating Badges: Live Status & Audio Controls */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          {/* Continuous Play Live Indicator */}
          <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-brand font-bold text-white shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase tracking-widest text-[9px]">Continuous Play</span>
          </div>

          {/* Sound ON/OFF Toggle Button */}
          <button
            type="button"
            onClick={handleAudioButtonClick}
            className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-brand font-bold transition-all duration-200 shadow-lg cursor-pointer backdrop-blur-md ${
              isAudioActive
                ? "bg-[#D4AF37] text-black border border-amber-300 shadow-[#D4AF37]/30 scale-105"
                : "bg-black/70 hover:bg-black/90 text-white border border-white/20 hover:border-white/40"
            }`}
            title={isAudioActive ? "Mute audio" : "Tap to listen to client audio"}
          >
            {isAudioActive ? (
              <>
                <svg className="w-3.5 h-3.5 fill-current animate-bounce" viewBox="0 0 24 24">
                  <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5-1.23l-5 4H2v12h4.5l5 4V2z" />
                </svg>
                <span>Sound ON</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current text-gray-300" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
                <span>Tap for Audio</span>
              </>
            )}
          </button>
        </div>

        {/* Center Play / Pause Indicator (Shown on Hover or when Paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-10 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white text-2xl pl-1 shadow-2xl backdrop-blur-md">
              ▶
            </div>
          </div>
        )}

        {/* Bottom Time Progress Line (Indicates active continuous playback) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 3. Card Bottom: Watch Model, Rating & Instagram Link */}
      <div className="p-4 sm:p-5 bg-neutral-950/80 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-sans font-semibold text-gray-300 truncate max-w-[200px]">
            {review.watchModel || review.title}
          </span>
          <span className="text-[#D4AF37] text-xs font-bold">★★★★★</span>
        </div>

        <div className="pt-1">
          <a
            href={review.fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl text-xs font-brand font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-gradient-to-r hover:from-purple-600/40 hover:via-pink-600/40 hover:to-amber-600/40 border border-white/10 hover:border-pink-500/40 transition-all flex items-center justify-center gap-2 text-center no-underline cursor-pointer active:scale-95 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current text-pink-400 shrink-0" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>Watch Review on Instagram</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CustomerReviewsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  // Monitor visibility of section to optimize background playback
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleToggleAudio = useCallback((id: string) => {
    setActiveAudioId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="py-20 sm:py-24 bg-[#0a0d14] text-white relative overflow-hidden border-t border-white/10"
    >
      {/* Background glow ornaments */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent border border-[#D4AF37]/40 shadow-sm">
            <span className="text-[#D4AF37] text-xs">★★★★★</span>
            <span className="text-[11px] font-brand font-bold uppercase tracking-widest text-[#D4AF37]">
              5.0 RATED BY 1,200+ TIMEPIECE LOVERS
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
            Our Trusted Customers’ Reviews
          </h2>

          <p className="text-gray-400 text-sm sm:text-base font-sans font-light max-w-2xl mx-auto leading-relaxed">
            Real video unboxings, craftsmanship checks, and on-wrist reviews shared by our clientele across India. All reviews play continuously.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-brand font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Continuous Autoplay Active
            </span>

            <a
              href="https://www.instagram.com/dappers_fit_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-brand text-[#D4AF37] hover:text-white font-semibold transition group bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 shadow-xs"
            >
              <svg className="w-3.5 h-3.5 fill-current text-pink-400" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Explore @dappers_fit_ on Instagram</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>

        {/* Continuous Playing Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {REVIEWS.map((review) => (
            <ReviewVideoCard
              key={review.id}
              review={review}
              activeAudioId={activeAudioId}
              onToggleAudio={handleToggleAudio}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Dedicated Instagram New Arrivals Discovery Banner */}
        <div className="mt-14 relative rounded-3xl bg-gradient-to-r from-purple-950/70 via-neutral-900/90 to-pink-950/50 border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-0.5 shadow-xl shrink-0">
                <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                  <svg className="w-8 h-8 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-brand font-bold uppercase tracking-wider mb-1">
                  <span>Daily Drops & Unboxings</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  Explore Our Instagram for New Arrivals
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 font-sans max-w-xl mt-1 leading-relaxed">
                  Follow <strong className="text-white font-semibold">@dappers_fit_</strong> to explore daily unboxings, newly arrived luxury references, wrist rolls, and limited collector editions before they sell out.
                </p>
              </div>
            </div>

            <a
              href="https://www.instagram.com/dappers_fit_?utm_source=ig_web_button_share_sheet&rpxt=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-brand font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:from-purple-500 hover:via-pink-500 hover:to-amber-500 shadow-lg shadow-pink-600/25 transition-all transform hover:scale-105 active:scale-95 no-underline cursor-pointer"
            >
              <span>Explore @dappers_fit_</span>
              <span className="text-sm">→</span>
            </a>
          </div>
        </div>

        {/* Bottom Trust Guarantee Bar */}
        <div className="mt-16 bg-neutral-900/60 border border-white/10 rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-[#D4AF37] text-2xl font-bold">✓</span>
              <h4 className="text-sm font-brand font-bold text-white uppercase tracking-wider">100% Insured Delivery</h4>
              <p className="text-xs font-sans text-gray-400">Doorstep express shipping with transit insurance across India.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[#D4AF37] text-2xl font-bold">✓</span>
              <h4 className="text-sm font-brand font-bold text-white uppercase tracking-wider">Open Box Video Inspection</h4>
              <p className="text-xs font-sans text-gray-400">Complete video proof of quality before final dispatch.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[#D4AF37] text-2xl font-bold">✓</span>
              <h4 className="text-sm font-brand font-bold text-white uppercase tracking-wider">COD & Online Payments</h4>
              <p className="text-xs font-sans text-gray-400">Pay via UPI, Cards, Net Banking, or Cash on Delivery.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
