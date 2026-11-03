"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const LOCKED_PLAYBACK_SPEED = 1.0;

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Initialize video
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      node.playsInline = true;
      node.playbackRate = LOCKED_PLAYBACK_SPEED;
      node.muted = true; // Start muted for instant autoplay compliance
      node.play().catch(() => {});
    }
  }, []);

  // Audio Toggle: Sound ON / OFF only
  const toggleAudio = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = 1.0;
      video.play().catch(() => {});
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video) return;

    video.loop = true;
    video.playbackRate = LOCKED_PLAYBACK_SPEED;

    // Performance Optimization: Pause playback when scrolled out of view
    let observer: IntersectionObserver | null = null;
    if (container && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(container);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-950 gpu-layer"
      style={{
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
        contain: "paint layout",
      }}
    >
      <video
        ref={setVideoRef}
        src="/showcase.mp4?v=3"
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="w-full h-full object-cover pointer-events-none"
        style={{
          transform: "translate3d(0, 0, 0)",
          WebkitTransform: "translate3d(0, 0, 0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      />

      {/* Dedicated Sound ON / OFF Toggle Button ONLY */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={toggleAudio}
          aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer shadow-lg active:scale-95 ${
            !isMuted
              ? "bg-[#D4AF37]/25 border-[#D4AF37] text-[#D4AF37] shadow-[#D4AF37]/30 ring-1 ring-[#D4AF37]/50"
              : "bg-black/75 border-white/20 text-gray-200 hover:text-white hover:border-white/40"
          }`}
        >
          {!isMuted ? (
            <>
              {/* Equalizer animation */}
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-[#D4AF37] rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-2" />
                <span className="w-0.5 bg-[#D4AF37] rounded-full animate-[bounce_0.4s_ease-in-out_infinite_0.15s] h-3" />
                <span className="w-0.5 bg-[#D4AF37] rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.3s] h-1.5" />
              </div>
              <span>Sound: ON</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>Sound: OFF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
