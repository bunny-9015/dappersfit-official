"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, registerUser, socialLoginUser } from "@/app/actions";

function UnifiedAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const errorParam = searchParams.get("error");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "admin_required"
      ? "Administrator credentials required to access the Admin Console."
      : errorParam === "google_oauth_pending"
      ? "To redirect directly to accounts.google.com, configure GOOGLE_CLIENT_ID in .env.local. You can also sign in directly with your Gmail below!"
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password visibility (Blind / Unblind) states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Social Auth Modal States
  const [socialModal, setSocialModal] = useState<"google" | "instagram" | "facebook" | null>(null);
  const [socialForm, setSocialForm] = useState({
    email: "",
    name: "",
  });

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // Handle Login (Auto-detects Customer vs Admin from DB)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const res = await loginUser(loginForm);
    setLoading(false);

    if (res.success && res.user) {
      if (res.user.role === "ADMIN") {
        router.push(redirectUrl.includes("admin") ? redirectUrl : "/admin/orders");
      } else {
        router.push(redirectUrl.includes("admin") ? "/account" : redirectUrl);
      }
      router.refresh();
    } else {
      setErrorMessage(res.error || "Failed to sign in. Please verify your email and password.");
    }
  };

  // Handle Register (Customer Account Creation)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const res = await registerUser({
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
      phone: registerForm.phone,
      address: registerForm.address,
      city: registerForm.city,
      pincode: registerForm.pincode,
    });
    setLoading(false);

    if (res.success && res.user) {
      setSuccessMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push(redirectUrl.includes("admin") ? "/account" : redirectUrl);
        router.refresh();
      }, 1200);
    } else {
      setErrorMessage(res.error || "Failed to create account.");
    }
  };

  // Handle Social Login (Google, Instagram, Facebook)
  const handleSocialSubmit = async (provider: "google" | "instagram" | "facebook", email: string, name: string) => {
    if (!email.trim()) {
      setErrorMessage("Please provide a valid account email or identifier.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const res = await socialLoginUser({
      provider,
      email,
      name: name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Member`,
    });
    setLoading(false);
    setSocialModal(null);

    if (res.success && res.user) {
      const providerLabel = provider === "google" ? "Google" : provider === "instagram" ? "Instagram" : "Facebook";
      setSuccessMessage(`Authenticated with ${providerLabel} successfully! Redirecting...`);
      setTimeout(() => {
        if (res.user.role === "ADMIN") {
          router.push(redirectUrl.includes("admin") ? redirectUrl : "/admin/orders");
        } else {
          router.push(redirectUrl.includes("admin") ? "/account" : redirectUrl);
        }
        router.refresh();
      }, 1000);
    } else {
      setErrorMessage(res.error || `Failed to sign in with ${provider}.`);
    }
  };

  const openSocial = (provider: "google" | "instagram" | "facebook") => {
    setErrorMessage(null);
    setSocialModal(provider);
    if (provider === "google") {
      setSocialForm({ email: "akheeranandandudipala@gmail.com", name: "Akheera Nandan" });
    } else if (provider === "instagram") {
      setSocialForm({ email: "akheeranandan.ig@gmail.com", name: "Akheera Nandan" });
    } else {
      setSocialForm({ email: "akheeranandan.fb@gmail.com", name: "Akheera Nandan" });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-[#D4AF37]/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <img
              src="/logo-dark.png"
              alt="DappersFit Logo"
              className="h-12 w-auto mx-auto object-contain transition-transform group-hover:scale-105 duration-200"
            />
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Luxury Horology • Client & Staff Portal
          </p>
        </div>

        {/* Main Box */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Main Mode Toggle: Sign In vs Create Account */}
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${
                mode === "login"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${
                mode === "register"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in">
              <span className="text-red-400 font-bold">⚠️</span>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in">
              <span className="text-emerald-400 font-bold">✓</span>
              <p className="leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* ================= MODE 1: SIGN IN (UNIFIED) ================= */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center pb-1">
                <p className="text-xs text-gray-400">
                  Sign in with your registered account. The system automatically detects whether you are a <strong>Customer</strong> or <strong>Administrator</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-[11px] text-[#D4AF37] hover:text-[#f3cc49] flex items-center gap-1.5 font-semibold transition px-2 py-0.5 rounded-md bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 cursor-pointer"
                    title={showLoginPassword ? "Click to Blind (Hide)" : "Click to Unblind (Show)"}
                  >
                    {showLoginPassword ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                        <span>Blind (Hide)</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Unblind (Show)</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-4 py-2.5 pr-11 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition p-1 cursor-pointer"
                    title={showLoginPassword ? "Blind password" : "Unblind password"}
                  >
                    {showLoginPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition shadow-lg mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? "Authenticating..." : "Sign In to Account"}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          )}

          {/* ================= MODE 2: CREATE ACCOUNT (CUSTOMER) ================= */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center pb-1">
                <p className="text-xs text-gray-400">
                  Join DappersFit to place orders, track shipments, and receive exclusive access to bespoke luxury horology collections.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Full Name <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Email Address <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, email: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Phone / WhatsApp <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9XXXXXXXXX"
                    value={registerForm.phone}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, phone: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Password (Min 6 chars) <span className="text-[#D4AF37]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="text-[11px] text-[#D4AF37] hover:text-[#f3cc49] flex items-center gap-1.5 font-semibold transition px-2 py-0.5 rounded-md bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 cursor-pointer"
                    title={showRegisterPassword ? "Click to Blind (Hide)" : "Click to Unblind (Show)"}
                  >
                    {showRegisterPassword ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                        <span>Blind (Hide)</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Unblind (Show)</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, password: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 pr-11 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition p-1 cursor-pointer"
                    title={showRegisterPassword ? "Blind password" : "Unblind password"}
                  >
                    {showRegisterPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Default Delivery Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Flat, Building, Street"
                  value={registerForm.address}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, address: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="City name"
                    value={registerForm.city}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, city: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="6-digit pincode"
                    value={registerForm.pincode}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, pincode: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition shadow-lg mt-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Registering..." : "Create Customer Account"}
              </button>
            </form>
          )}

          {/* Social Sign In Options: Google, Instagram, Facebook */}
          <div className="pt-2 space-y-3.5 border-t border-white/10">
            <div className="relative flex items-center justify-center">
              <span className="bg-neutral-900 px-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                Or continue with
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => openSocial("google")}
                className="py-2.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-white/15 hover:border-white/30 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-semibold text-white transition shadow-sm hover:scale-[1.02] cursor-pointer"
                title="Sign in with Google"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="truncate">Google</span>
              </button>

              {/* Instagram Button */}
              <button
                type="button"
                onClick={() => openSocial("instagram")}
                className="py-2.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-white/15 hover:border-pink-500/40 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-semibold text-white transition shadow-sm hover:scale-[1.02] cursor-pointer"
                title="Sign in with Instagram"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <radialGradient id="ig-grad" cx="20%" cy="100%" r="130%">
                    <stop offset="0%" stopColor="#ffb900" />
                    <stop offset="25%" stopColor="#ff0140" />
                    <stop offset="50%" stopColor="#d300c5" />
                    <stop offset="100%" stopColor="#7638fa" />
                  </radialGradient>
                  <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
                  <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.3-8.6a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" fill="#fff" />
                  <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#fff" strokeWidth="1.5" fill="none" />
                </svg>
                <span className="truncate">Instagram</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => openSocial("facebook")}
                className="py-2.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-white/15 hover:border-blue-500/40 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-semibold text-white transition shadow-sm hover:scale-[1.02] cursor-pointer"
                title="Sign in with Facebook"
              >
                <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="truncate">Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= SOCIAL AUTH MODAL DIALOG ================= */}
        {socialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-neutral-900 border border-white/15 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  {socialModal === "google" && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  {socialModal === "instagram" && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <radialGradient id="ig-grad-m" cx="20%" cy="100%" r="130%">
                        <stop offset="0%" stopColor="#ffb900" />
                        <stop offset="25%" stopColor="#ff0140" />
                        <stop offset="50%" stopColor="#d300c5" />
                        <stop offset="100%" stopColor="#7638fa" />
                      </radialGradient>
                      <rect width="24" height="24" rx="6" fill="url(#ig-grad-m)" />
                      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.3-8.6a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" fill="#fff" />
                      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#fff" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}
                  {socialModal === "facebook" && (
                    <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <h3 className="text-sm font-bold text-white capitalize">
                    {socialModal === "google"
                      ? "Sign in with Google"
                      : socialModal === "instagram"
                      ? "Log in with Instagram"
                      : "Log in with Facebook"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSocialModal(null)}
                  className="text-gray-400 hover:text-white text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Google Specialized Gmail Selector */}
              {socialModal === "google" ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Choose your Google / Gmail account to sign in to DappersFit:
                  </p>

                  {/* 1-Tap Akheera Nandan Google Account Card */}
                  <div
                    onClick={() => handleSocialSubmit("google", "akheeranandandudipala@gmail.com", "Akheera Nandan")}
                    className="p-3.5 bg-neutral-950 hover:bg-neutral-800 border border-[#4285F4]/40 hover:border-[#4285F4] rounded-xl flex items-center justify-between transition cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EA4335] text-white font-bold flex items-center justify-center text-sm shadow">
                        A
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white group-hover:text-[#4285F4] transition">
                          Akheera Nandan
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          akheeranandandudipala@gmail.com
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#4285F4] bg-[#4285F4]/10 px-2.5 py-1 rounded-lg shrink-0">
                      Sign In
                    </span>
                  </div>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-white/10 absolute inset-0 top-1/2" />
                    <span className="relative bg-neutral-900 px-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      Or use another Gmail
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                        Gmail Address
                      </label>
                      <input
                        type="email"
                        required
                        value={socialForm.email}
                        onChange={(e) => setSocialForm({ ...socialForm, email: e.target.value })}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-neutral-950 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4285F4] transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={socialForm.name}
                        onChange={(e) => setSocialForm({ ...socialForm, name: e.target.value })}
                        placeholder="Your Name"
                        className="w-full bg-neutral-950 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4285F4] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialSubmit("google", socialForm.email, socialForm.name)}
                      className="w-full py-3 bg-white hover:bg-gray-100 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{loading ? "Authenticating..." : `Continue with Google`}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>

                    <a
                      href="/api/auth/google"
                      className="block text-center text-[11px] text-gray-400 hover:text-[#4285F4] transition underline py-1"
                    >
                      Launch accounts.google.com redirect →
                    </a>

                    <button
                      type="button"
                      onClick={() => setSocialModal(null)}
                      className="w-full py-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Instagram / Facebook form */
                <div className="space-y-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Connect your verified <strong className="text-white capitalize">{socialModal}</strong> profile to access your DappersFit account, order history, and tracking.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                        {socialModal === "instagram" ? "Instagram Handle or Email" : "Account Email"}
                      </label>
                      <input
                        type="text"
                        required
                        value={socialForm.email}
                        onChange={(e) => setSocialForm({ ...socialForm, email: e.target.value })}
                        placeholder={
                          socialModal === "instagram"
                            ? "@your_instagram or email"
                            : "facebook_user@example.com"
                        }
                        className="w-full bg-neutral-950 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={socialForm.name}
                        onChange={(e) => setSocialForm({ ...socialForm, name: e.target.value })}
                        placeholder="Your Name"
                        className="w-full bg-neutral-950 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSocialSubmit(socialModal, socialForm.email, socialForm.name)}
                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                        socialModal === "instagram"
                          ? "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-90"
                          : "bg-[#1877F2] text-white hover:bg-blue-600"
                      }`}
                    >
                      <span>{loading ? "Authenticating..." : `Continue as ${socialForm.name || "Member"}`}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSocialModal(null)}
                      className="w-full py-2 text-xs text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Return Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-white transition inline-flex items-center gap-1.5"
          >
            <span>← Return to DappersFit Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center text-xs">Loading portal...</div>}>
      <UnifiedAuthForm />
    </Suspense>
  );
}
