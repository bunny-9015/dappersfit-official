"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { updateOrderStatus, deleteOrder } from "@/app/actions";
import { downloadOrPrintInvoice } from "@/lib/invoice";

export interface OrderItemData {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

export interface OrderData {
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
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: OrderItemData[];
}

interface OrdersManagerProps {
  initialOrders: OrderData[];
}

export default function OrdersManager({ initialOrders }: OrdersManagerProps) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<OrderData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Status counts
  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.orderStatus === "Pending").length,
    confirmed: orders.filter((o) => o.orderStatus === "Confirmed").length,
    dispatched: orders.filter((o) => o.orderStatus === "Dispatched").length,
    delivered: orders.filter((o) => o.orderStatus === "Delivered").length,
    cancelled: orders.filter((o) => o.orderStatus === "Cancelled").length,
  };

  // Total sales calculation
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "Cancelled")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "All" ||
      order.orderStatus.toLowerCase() === selectedStatus.toLowerCase();

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerPhone.toLowerCase().includes(query) ||
      (order.city && order.city.toLowerCase().includes(query)) ||
      (order.pincode && order.pincode.toLowerCase().includes(query)) ||
      order.items.some(
        (i) =>
          i.productName.toLowerCase().includes(query) ||
          i.brand.toLowerCase().includes(query)
      );

    return matchesStatus && matchesSearch;
  });

  // Handle status update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    startTransition(async () => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );

      const res = await updateOrderStatus(
        orderId,
        newStatus,
        targetOrder
          ? {
              orderNumber: targetOrder.orderNumber,
              customerName: targetOrder.customerName,
              customerPhone: targetOrder.customerPhone,
              shippingAddress: targetOrder.shippingAddress,
              paymentMethod: targetOrder.paymentMethod,
              paymentStatus: targetOrder.paymentStatus,
              totalAmount: targetOrder.totalAmount,
              notes: targetOrder.notes,
            }
          : undefined
      );
      if (res.success) {
        showToast(`Order status updated to "${newStatus}"`);
      } else {
        showToast("Failed to update status");
      }
    });
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete order #${orderNumber}?`)) {
      return;
    }
    startTransition(async () => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      const res = await deleteOrder(orderId, orderNumber);
      if (res.success) {
        showToast(`Order #${orderNumber} deleted permanently.`);
      } else {
        showToast("Failed to delete order");
      }
    });
  };

  // Format date helper
  const formatDate = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // WhatsApp prefilled link generator
  const getWhatsAppLink = (order: OrderData) => {
    const cleanPhone = order.customerPhone.replace(/\D/g, "");
    const phoneWithCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const itemsSummary = order.items
      .map((i) => `${i.quantity}x ${i.brand} ${i.productName}`)
      .join(", ");

    const text = encodeURIComponent(
      `Hello ${order.customerName},\n\n` +
      `Thank you for shopping with DappersFit! ⌚\n` +
      `Regarding your Order #${order.orderNumber}:\n` +
      `• Items: ${itemsSummary}\n` +
      `• Total Amount: ₹${order.totalAmount.toLocaleString("en-IN")}\n` +
      `• Payment Mode: ${order.paymentMethod.toUpperCase()}\n` +
      `• Current Status: ${order.orderStatus.toUpperCase()}\n\n` +
      `Shipping Address: ${order.shippingAddress}, ${order.city || ""}, ${order.state || ""} - ${order.pincode || ""}\n\n` +
      `Let us know if you have any questions. We are preparing your luxury package for swift delivery!`
    );

    return `https://wa.me/${phoneWithCode}?text=${text}`;
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-[#D4AF37] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="text-[#D4AF37] font-bold">✓</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Dashboard Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{statusCounts.all}</p>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales</p>
          <p className="mt-1 text-2xl font-black text-[#B8860B]">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{statusCounts.pending}</p>
        </div>

        {/* Confirmed */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Confirmed</p>
          <p className="mt-1 text-2xl font-black text-blue-900">{statusCounts.confirmed}</p>
        </div>

        {/* Dispatched */}
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Dispatched</p>
          <p className="mt-1 text-2xl font-black text-purple-900">{statusCounts.dispatched}</p>
        </div>

        {/* Delivered */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Delivered</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{statusCounts.delivered}</p>
        </div>
      </div>

      {/* 2. Controls Bar: Status Filter Tabs & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "All", label: "All Orders", count: statusCounts.all },
              { id: "Pending", label: "Pending", count: statusCounts.pending },
              { id: "Confirmed", label: "Confirmed", count: statusCounts.confirmed },
              { id: "Dispatched", label: "Dispatched", count: statusCounts.dispatched },
              { id: "Delivered", label: "Delivered", count: statusCounts.delivered },
              { id: "Cancelled", label: "Cancelled", count: statusCounts.cancelled },
            ].map((tab) => {
              const isActive = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? "bg-black text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by Order #, Name, Phone, Watch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">No orders found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? `No orders match "${searchQuery}". Try adjusting your search query.`
              : "No customer orders have been placed in this status category yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            // Status color formatting
            const statusConfig = {
              Pending: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
              Confirmed: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
              Dispatched: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
              Delivered: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
              Cancelled: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
            }[order.orderStatus] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" };

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-bold text-gray-900 bg-white border border-gray-300 px-2.5 py-1 rounded-md shadow-xs">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {order.orderStatus}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-200 text-gray-800 uppercase tracking-wider">
                      {order.paymentMethod === "cod"
                        ? "Cash On Delivery"
                        : order.paymentMethod === "cashfree"
                        ? "Cashfree Online"
                        : order.paymentMethod === "razorpay"
                        ? "Razorpay Online"
                        : "Online UPI"}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {order.paymentStatus === "paid" ? "✓ Paid" : "⏳ Unpaid"}
                    </span>
                  </div>

                  {/* Top Right: Total Amount */}
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-medium mr-2">Grand Total:</span>
                    <span className="text-lg font-black text-gray-900 font-mono">
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Order Body: Customer info & Items */}
                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Customer & Delivery Details (5 cols) */}
                  <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Customer & Delivery Details
                      </h4>
                      {/* 1-Click WhatsApp Button */}
                      <a
                        href={getWhatsAppLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-600 font-mono flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${order.customerPhone}`} className="hover:underline">
                          {order.customerPhone}
                        </a>
                      </p>
                      {order.customerEmail && (
                        <p className="text-xs text-gray-500">{order.customerEmail}</p>
                      )}
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs text-gray-700 space-y-1">
                      <span className="font-semibold text-gray-900 block">Delivery Address:</span>
                      <p className="leading-relaxed">{order.shippingAddress}</p>
                      {(order.city || order.state || order.pincode) && (
                        <p className="font-medium text-gray-900">
                          {[order.city, order.state, order.pincode].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 pt-1">
                        Method: <span className="font-semibold text-gray-700 capitalize">{order.shippingMethod}</span>
                      </p>
                    </div>

                    {/* Promo Code Note */}
                    {order.promoCode && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <span>🏷️ Applied Promo:</span>
                        <span className="font-bold font-mono">{order.promoCode}</span>
                        <span>(-₹{order.discountAmount})</span>
                      </div>
                    )}

                    {/* Payment & Gateway Notes */}
                    {order.notes && (
                      <div className="text-[11px] text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-2 font-mono">
                        <span className="font-bold text-blue-900 block mb-0.5">Payment Gateway Reference:</span>
                        <span>{order.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Ordered Watches & Summary (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Ordered Watches ({order.items.reduce((sum, i) => sum + i.quantity, 0)})
                    </h4>

                    {/* Items List */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100"
                        >
                          <div className="relative w-12 h-12 rounded-lg bg-neutral-900 flex-shrink-0 overflow-hidden border border-gray-200">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                ⌚
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8860B] block">
                              {item.brand}
                            </span>
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {item.productName}
                            </p>
                            <span className="text-[11px] text-gray-500">
                              Qty: <strong className="text-gray-900">{item.quantity}</strong> × ₹
                              {item.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-gray-900">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs space-y-1.5">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount ({order.promoCode || "Offer"}):</span>
                          <span>-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping ({order.shippingMethod}):</span>
                        <span>
                          {order.shippingCost === 0 ? "FREE" : `₹${order.shippingCost}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1.5 text-sm">
                        <span>Total Payable:</span>
                        <span className="text-[#B8860B] font-mono">
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Footer: Action Controls (Status Update, Print Invoice, Delete) */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  {/* Status Updater Stepper / Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">Change Status:</span>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={isPending}
                      className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 shadow-xs focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Actions: Print Invoice, WhatsApp, Delete */}
                  <div className="flex items-center gap-2">
                    {/* Print Packing Slip & Invoice Button */}
                    <button
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print Slip / Invoice</span>
                    </button>

                    {/* Delete Order Button */}
                    <button
                      onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                      className="text-xs text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Delete Order"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Luxury Packing Slip & Tax Invoice Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden print:shadow-none print:w-full print:rounded-none">
            {/* Modal Action Bar (Hidden when printing) */}
            <div className="bg-neutral-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37] font-serif font-black text-lg">DappersFit</span>
                <span className="text-xs text-gray-400 font-mono">Invoice #{selectedOrderForInvoice.orderNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    downloadOrPrintInvoice({
                      orderNumber: selectedOrderForInvoice.orderNumber,
                      createdAt: selectedOrderForInvoice.createdAt,
                      customerName: selectedOrderForInvoice.customerName,
                      customerPhone: selectedOrderForInvoice.customerPhone,
                      customerEmail: selectedOrderForInvoice.customerEmail,
                      shippingAddress: selectedOrderForInvoice.shippingAddress,
                      city: selectedOrderForInvoice.city,
                      state: selectedOrderForInvoice.state,
                      pincode: selectedOrderForInvoice.pincode,
                      paymentMethod: selectedOrderForInvoice.paymentMethod,
                      paymentStatus: selectedOrderForInvoice.paymentStatus,
                      orderStatus: selectedOrderForInvoice.orderStatus,
                      shippingMethod: selectedOrderForInvoice.shippingMethod,
                      subtotal: selectedOrderForInvoice.subtotal,
                      discountAmount: selectedOrderForInvoice.discountAmount,
                      promoCode: selectedOrderForInvoice.promoCode,
                      shippingCost: selectedOrderForInvoice.shippingCost,
                      totalAmount: selectedOrderForInvoice.totalAmount,
                      items: selectedOrderForInvoice.items.map((it) => ({
                        name: it.productName,
                        brand: it.brand,
                        quantity: it.quantity,
                        price: it.price,
                      })),
                    })
                  }
                  className="bg-[#D4AF37] hover:bg-[#b8952f] text-black font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print / Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="text-gray-400 hover:text-white text-sm px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Print Sheet Content with Large Centered Transparent Watermark */}
            <div className="relative p-8 sm:p-10 space-y-6 text-gray-900 font-sans print:p-6 overflow-hidden" id="printable-invoice">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
                <img
                  src="/invoice-watermark.png"
                  alt=""
                  className="w-[420px] max-w-[78%] h-auto opacity-[0.09] object-contain select-none"
                />
              </div>
              <div className="relative z-10 space-y-6">
              {/* Document Header */}
              <div className="border-b-2 border-black pb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-serif font-black tracking-tight text-black">
                    DAPPERSFIT
                  </h1>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mt-0.5">
                    Haute Horology &amp; Luxury Timepieces
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Web: https://www.dappersfit.com | WhatsApp: +91 93639 03915
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-black text-white text-xs uppercase tracking-widest font-bold px-3 py-1 rounded">
                    Tax Invoice & Packing Slip
                  </span>
                  <div className="mt-3 text-xs space-y-1 font-mono text-gray-700">
                    <p><strong>Order #:</strong> {selectedOrderForInvoice.orderNumber}</p>
                    <p><strong>Date:</strong> {new Date(selectedOrderForInvoice.createdAt).toLocaleDateString("en-IN")}</p>
                    <p><strong>Payment:</strong> {selectedOrderForInvoice.paymentMethod.toUpperCase()}</p>
                    <p><strong>Status:</strong> {selectedOrderForInvoice.orderStatus.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Ship-To & Bill-To Section */}
              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Delivery Address (Consignee)
                  </h3>
                  <p className="font-bold text-sm text-gray-900">{selectedOrderForInvoice.customerName}</p>
                  <p className="text-gray-700 mt-1">{selectedOrderForInvoice.shippingAddress}</p>
                  <p className="text-gray-900 font-medium">
                    {[selectedOrderForInvoice.city, selectedOrderForInvoice.state, selectedOrderForInvoice.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="mt-2 text-gray-800">
                    <strong>Phone:</strong> {selectedOrderForInvoice.customerPhone}
                  </p>
                  {selectedOrderForInvoice.customerEmail && (
                    <p className="text-gray-800">
                      <strong>Email:</strong> {selectedOrderForInvoice.customerEmail}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Dispatch & Shipping Details
                  </h3>
                  <p><strong>Shipping Mode:</strong> {selectedOrderForInvoice.shippingMethod.toUpperCase()} Delivery</p>
                  <p className="mt-1">
                    <strong>Payment Mode:</strong>{" "}
                    {selectedOrderForInvoice.paymentMethod === "cod"
                      ? "Cash On Delivery (Collect Upon Handover)"
                      : "Prepaid Online / UPI"}
                  </p>
                  <p className="mt-1">
                    <strong>Payment Status:</strong>{" "}
                    <span className="uppercase font-semibold">{selectedOrderForInvoice.paymentStatus}</span>
                  </p>
                  <p className="mt-2 text-gray-500 text-[11px]">
                    Inspected & packed in velvet travel case with tamper-evident seal.
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200">
                  <thead className="bg-black text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Watch Description</th>
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrderForInvoice.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-gray-900">{item.productName}</td>
                        <td className="py-3 px-3 text-gray-600 font-medium uppercase">{item.brand}</td>
                        <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono">₹{item.price.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Breakdown & Authorized Signatory */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="text-xs text-gray-600 space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider">
                    Authenticity Guarantee
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    This certifies that the timepiece(s) described herein have passed our multi-point inspection for dial finish, movement calibration, and bezel precision.
                  </p>
                  <div className="pt-6 border-t border-gray-200 mt-6 flex items-center justify-between">
                    <div>
                      <div className="w-28 border-b border-black mb-1"></div>
                      <span className="text-[10px] uppercase font-bold text-gray-500">
                        Authorized Quality Seal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrderForInvoice.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {selectedOrderForInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount ({selectedOrderForInvoice.promoCode || "Special"}):</span>
                      <span>-₹{selectedOrderForInvoice.discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Charges:</span>
                    <span>
                      {selectedOrderForInvoice.shippingCost === 0 ? "FREE" : `₹${selectedOrderForInvoice.shippingCost}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST / Taxes:</span>
                    <span>₹0 (Included)</span>
                  </div>
                  <div className="flex justify-between text-black font-black text-base border-t-2 border-black pt-2">
                    <span>Total Payable:</span>
                    <span>₹{selectedOrderForInvoice.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t border-gray-200 pt-4 text-center text-[10px] text-gray-500">
                <p>Thank you for choosing DappersFit. For queries, contact WhatsApp +91 93639 03915 or https://www.dappersfit.com.</p>
                <p className="mt-0.5">Please record an unboxing video upon courier delivery for warranty validation.</p>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
