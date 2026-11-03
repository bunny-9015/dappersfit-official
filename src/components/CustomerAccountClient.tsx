"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser, updateUserProfile } from "@/app/actions";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  discountAmount: number;
  promoCode: string | null;
  shippingCost: number;
  shippingMethod: string;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    brand: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
  }>;
}

interface Props {
  user: AccountUser;
  orders: CustomerOrder[];
}

export default function CustomerAccountClient({ user, orders }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [loggingOut, setLoggingOut] = useState(false);

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    pincode: user.pincode || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutUser();
    router.push("/");
    router.refresh();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const res = await updateUserProfile(profileForm);
    setSavingProfile(false);
    if (res.success) {
      setProfileMsg("Profile updated successfully!");
      setEditingProfile(false);
      router.refresh();
    } else {
      setProfileMsg("Failed to update profile.");
    }
  };

  const statusSteps = ["Pending", "Confirmed", "Dispatched", "Delivered"];

  return (
    <div className="space-y-8">
      {/* 1. Profile Header Card */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black font-black text-2xl flex items-center justify-center font-serif shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h1>
              {user.role === "ADMIN" ? (
                <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  👑 Store Admin
                </span>
              ) : (
                <span className="bg-white/10 text-gray-300 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Customer
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono">{user.email}</p>
            {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {user.role === "ADMIN" && (
            <Link
              href="/admin/orders"
              className="bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2"
            >
              <span>👑 Open Admin Console</span>
            </Link>
          )}

          <Link
            href="/"
            className="text-xs text-gray-300 hover:text-white px-3.5 py-2 rounded-xl border border-white/10 hover:border-white/30 transition"
          >
            Storefront
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs text-red-400 hover:text-red-300 px-3.5 py-2 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition"
          >
            {loggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-white/10 space-x-6">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === "orders"
              ? "border-[#D4AF37] text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <span>📦 My Orders</span>
          <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === "profile"
              ? "border-[#D4AF37] text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <span>👤 Shipping & Profile</span>
        </button>
      </div>

      {/* 3. Tab: ORDERS */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-2xl">
                ⌚
              </div>
              <h3 className="text-lg font-serif font-bold text-white">No Orders Yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Explore our curated luxury horology collection and acquire your signature timepiece today.
              </p>
              <Link
                href="/#catalog"
                className="inline-block bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full transition shadow-lg mt-2"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const currentStepIndex = statusSteps.indexOf(order.orderStatus);

              return (
                <div
                  key={order.id}
                  className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="bg-neutral-950 p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-md">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-400 mr-2">Total Amount:</span>
                      <span className="text-base font-black text-[#D4AF37] font-mono">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Visual Status Progress Stepper */}
                  <div className="px-6 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                      Delivery Progress
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {statusSteps.map((step, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={step} className="space-y-1.5">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isDone
                                  ? isCurrent
                                    ? "bg-[#D4AF37]"
                                    : "bg-emerald-500"
                                  : "bg-white/10"
                              }`}
                            />
                            <p
                              className={`text-[10px] font-semibold ${
                                isDone ? "text-white" : "text-gray-500"
                              }`}
                            >
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-6 py-2 space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                      Timepieces ({order.items.reduce((s, i) => s + i.quantity, 0)})
                    </p>

                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-white/5"
                        >
                          <div className="relative w-12 h-12 rounded-lg bg-neutral-900 flex-shrink-0 overflow-hidden border border-white/10">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                ⌚
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                              {item.brand}
                            </span>
                            <p className="text-xs font-bold text-white truncate">
                              {item.productName}
                            </p>
                            <span className="text-[11px] text-gray-400">
                              Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-white">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer & Actions */}
                  <div className="bg-neutral-950 p-4 sm:p-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <p>
                        <strong>Shipped To:</strong> {order.shippingAddress},{" "}
                        {[order.city, order.state, order.pincode].filter(Boolean).join(", ")}
                      </p>
                      <p>
                        <strong>Payment:</strong>{" "}
                        {order.paymentMethod === "cod"
                          ? "Cash On Delivery"
                          : order.paymentMethod === "razorpay"
                          ? "Razorpay Online (UPI/Cards)"
                          : "Online UPI"}{" "}
                        <span
                          className={`inline-block ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === "paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {order.paymentStatus === "paid" ? "✓ Paid" : "Pending"}
                        </span>
                      </p>
                    </div>

                    {/* WhatsApp Support Button */}
                    <a
                      href={getWhatsAppChatUrl(
                        `Hi DappersFit Concierge, I would like an update regarding my Order #${order.orderNumber}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>Need Help? Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Tab: PROFILE & SHIPPING */}
      {activeTab === "profile" && (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Default Shipping Details</h2>
              <p className="text-xs text-gray-400">
                These details will be automatically used to speed up your future orders.
              </p>
            </div>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs uppercase px-4 py-2 rounded-xl transition"
              >
                Edit Details
              </button>
            )}
          </div>

          {profileMsg && (
            <p className="text-xs text-emerald-400 font-semibold">{profileMsg}</p>
          )}

          {editingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={profileForm.pincode}
                    onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#D4AF37] text-black font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition"
                >
                  {savingProfile ? "Saving..." : "Save Address"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="text-xs text-gray-400 hover:text-white px-4 py-2.5 rounded-xl border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs text-gray-300">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || "Not set"}</p>
              <p>
                <strong>Delivery Address:</strong>{" "}
                {user.address ? `${user.address}, ${user.city || ""} - ${user.pincode || ""}` : "No address saved"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
