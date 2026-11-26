"use client";

import React, { useState, useTransition } from "react";
import { saveProduct, deleteProduct, toggleProductStock } from "@/app/actions";

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProductItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  imageUrl: string | null;
  images: string[];
  inStock: boolean;
  quantity: number;
  preBookingAvailable: boolean;
  expectedDeliveryDate: Date | string | null;
  categoryId: string;
  category: AdminCategoryItem;
}

interface ProductsManagerProps {
  initialProducts: AdminProductItem[];
  initialCategories: AdminCategoryItem[];
}

// Client-side resize & compress so multi-image uploads stay fast and crisp on Vercel
async function compressImageToDataUrl(file: File, maxDim = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, width, height);
        const webp = canvas.toDataURL("image/webp", quality);
        resolve(webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const emptyForm = {
  id: "",
  name: "",
  brand: "",
  price: "",
  description: "",
  categoryId: "new",
  newCategory: "",
  inStock: true,
  quantity: "1",
  preBookingAvailable: false,
  expectedDeliveryDate: "",
  images: [] as string[],
};

export default function ProductsManager({
  initialProducts,
  initialCategories,
}: ProductsManagerProps) {
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);
  const [categories, setCategories] = useState<AdminCategoryItem[]>(initialCategories);
  const [form, setForm] = useState(emptyForm);
  const [urlInput, setUrlInput] = useState("");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort();

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q);
    const matchesBrand = brandFilter === "ALL" || p.brand === brandFilter;
    return matchesSearch && matchesBrand;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    setFeedback(null);
    try {
      const remainingSlots = Math.max(0, 10 - form.images.length);
      const selected = files.slice(0, remainingSlots);
      const compressed = await Promise.all(selected.map((f) => compressImageToDataUrl(f)));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...compressed] }));
    } catch {
      setFeedback({ type: "error", text: "Could not process one or more images. Try JPG/PNG/WebP." });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (form.images.length >= 10) {
      setFeedback({ type: "error", text: "Maximum 10 images per product." });
      return;
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    setUrlInput("");
  };

  const setAsCover = (idx: number) => {
    setForm((prev) => {
      const next = [...prev.images];
      const [picked] = next.splice(idx, 1);
      return { ...prev, images: [picked, ...next] };
    });
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const startEdit = (p: AdminProductItem) => {
    const gallery = Array.from(new Set([p.imageUrl, ...(p.images || [])].filter(Boolean) as string[]));
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: String(p.price),
      description: p.description || "",
      categoryId: p.categoryId,
      newCategory: "",
      inStock: p.inStock,
      quantity: String(p.quantity),
      preBookingAvailable: Boolean(p.preBookingAvailable),
      expectedDeliveryDate: p.expectedDeliveryDate
        ? new Date(p.expectedDeliveryDate).toISOString().slice(0, 10)
        : "",
      images: gallery,
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveProduct({
        id: form.id || undefined,
        name: form.name,
        brand: form.brand,
        price: parseFloat(form.price),
        description: form.description,
        categoryId: form.categoryId,
        newCategory: form.newCategory,
        images: form.images,
        inStock: form.inStock,
        quantity: parseInt(form.quantity, 10) || 1,
        preBookingAvailable: form.preBookingAvailable,
        expectedDeliveryDate: form.expectedDeliveryDate || null,
      });

      if (!res.success || !res.product) {
        setFeedback({ type: "error", text: res.error || "Could not save product." });
        return;
      }

      const saved = res.product as AdminProductItem;
      setProducts((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        return exists ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev];
      });
      if (saved.category && !categories.some((c) => c.id === saved.category.id)) {
        setCategories((prev) => [...prev, saved.category].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setFeedback({
        type: "success",
        text: form.id ? `Updated "${saved.name}" successfully!` : `Added "${saved.name}" to catalog!`,
      });
      setForm(emptyForm);
    });
  };

  const handleToggleStock = (p: AdminProductItem) => {
    const next = !p.inStock;
    setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, inStock: next } : item)));
    startTransition(async () => {
      const res = await toggleProductStock(p.id, next);
      if (!res.success) {
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, inStock: !next } : item)));
        setFeedback({ type: "error", text: res.error || "Failed to update stock." });
      }
    });
  };

  const handleDelete = (p: AdminProductItem) => {
    if (!window.confirm(`Delete "${p.brand} ${p.name}" permanently?`)) return;
    startTransition(async () => {
      const res = await deleteProduct(p.id);
      if (res.success) {
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
        if (form.id === p.id) setForm(emptyForm);
        setFeedback({ type: "success", text: `Deleted "${p.name}".` });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to delete product." });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Add / Edit Watch Form */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-serif font-bold text-gray-900">
              {form.id ? "Edit Watch Listing" : "Add New Watch"}
            </h2>
            <p className="text-xs text-gray-500">
              Upload multiple product photos, pricing, stock &amp; specs.
            </p>
          </div>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-lg bg-gray-100 cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Watch Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Submariner Date"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brand *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Rolex"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min={1}
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 2499"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 px-3 py-2 text-xs focus:outline-none"
              >
                <option value="new">Auto-create from Brand</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Product Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Movement, dial color, case size, strap material, water resistance..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Multi-Image Uploader & URL Adder */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800">
                Product Photos ({form.images.length}/10)
              </label>
              <label className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-[11px] font-bold cursor-pointer transition">
                {isUploading ? "Compressing..." : "+ Upload Photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Or paste image URL (https://... or /watches/...)"
                className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-gray-900"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-800 cursor-pointer"
              >
                Add URL
              </button>
            </div>

            {form.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {form.images.map((src, idx) => (
                  <div
                    key={`${idx}-${src.slice(0, 24)}`}
                    className={`relative group rounded-xl overflow-hidden bg-white border aspect-square flex items-center justify-center p-1 ${
                      idx === 0 ? "border-amber-500 ring-1 ring-amber-500" : "border-gray-200"
                    }`}
                  >
                    <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-contain" />
                    {idx === 0 ? (
                      <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsCover(idx)}
                        className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center cursor-pointer"
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">
                Select multiple watch angles (front, dial, clasp, box). First photo is used as the cover.
              </p>
            )}
          </div>

          {/* Stock & Pre-booking Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                className="w-4 h-4 accent-gray-900"
              />
              In Stock
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Quantity</label>
              <input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.preBookingAvailable}
                onChange={(e) => setForm({ ...form, preBookingAvailable: e.target.checked })}
                className="w-4 h-4 accent-gray-900"
              />
              Pre-Booking
            </label>
          </div>

          {form.preBookingAvailable && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={form.expectedDeliveryDate}
                onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || isUploading}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Saving..." : form.id ? "Save Changes" : "Add Watch to Catalog"}
          </button>
        </form>
      </div>

      {/* RIGHT: Live Inventory List */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-serif font-bold text-gray-900">
              Current Inventory ({filteredProducts.length} / {products.length})
            </h2>
            <p className="text-[11px] text-gray-500">Synced live with Supabase PostgreSQL</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search watches..."
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs w-40 sm:w-48 focus:bg-white focus:outline-none focus:border-gray-900"
            />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="ALL">All Brands</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ul className="divide-y divide-gray-100 max-h-[680px] overflow-y-auto">
          {filteredProducts.length === 0 && (
            <li className="p-8 text-center text-xs text-gray-500">No matching watches found.</li>
          )}
          {filteredProducts.map((product) => {
            const photoCount = Array.from(
              new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))
            ).length;
            return (
              <li
                key={product.id}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 shrink-0 flex items-center justify-center p-1 overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-gray-400">No img</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      <span className="font-semibold text-[#996515]">{product.brand}</span> • ₹
                      {product.price.toLocaleString("en-IN")} • {product.category?.name || "Uncategorized"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(product)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full cursor-pointer ${
                          product.inStock
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {product.inStock ? `In Stock (${product.quantity})` : "Out of Stock"}
                      </button>
                      <span className="text-[10px] text-gray-400">
                        {photoCount} {photoCount === 1 ? "photo" : "photos"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
