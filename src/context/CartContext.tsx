"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { normalizeProductPrice } from "@/lib/brandUtils";

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export interface PromoCode {
  code: string;
  type: "percent" | "flat";
  value: number; // e.g. 10 for 10% or 500 for ₹500
  minOrder?: number;
  description: string;
}

export const AVAILABLE_PROMOS: PromoCode[] = [
  {
    code: "DAPPER10",
    type: "percent",
    value: 10,
    description: "10% OFF on your entire luxury order",
  },
  {
    code: "FLAT500",
    type: "flat",
    value: 500,
    minOrder: 2500,
    description: "Flat ₹500 OFF on orders above ₹2,499",
  },
  {
    code: "ROYAL15",
    type: "percent",
    value: 15,
    minOrder: 5000,
    description: "15% OFF VIP luxury orders above ₹5,000",
  },
  {
    code: "WELCOME300",
    type: "flat",
    value: 300,
    minOrder: 1499,
    description: "₹300 Welcome bonus on orders above ₹1,499",
  },
];

export const ROLEX_OG_BOX_PRICE = 499;
export const COD_EXTRA_CHARGE = 300;
export const COD_ADVANCE_COLLECTION = 300;

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: {
      id: string | number;
      name: string;
      brand?: string;
      price: number | string;
      imageUrl?: string | null;
    },
    quantity?: number
  ) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, delta: number) => void;
  setQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
  totalCount: number;
  subtotal: number;
  totalPrice: number; // Backwards-compatible alias for subtotal
  shippingMethod: "standard" | "express";
  setShippingMethod: (method: "standard" | "express") => void;
  shippingCost: number;
  appliedPromo: PromoCode | null;
  discountAmount: number;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  taxAmount: number;
  finalTotal: number;
  availablePromos: PromoCode[];
  toastMessage: string | null;
  clearToast: () => void;
  includeOgRolexBox: boolean;
  setIncludeOgRolexBox: (include: boolean) => void;
  hasRolexInCart: boolean;
  rolexBoxPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [includeOgRolexBox, setIncludeOgRolexBox] = useState<boolean>(false);

  // Check if any Rolex watch is in the cart
  const hasRolexInCart = useMemo(() => {
    return items.some((item) => {
      const b = (item.brand || "").toLowerCase();
      const n = (item.name || "").toLowerCase();
      return b.includes("rolex") || n.includes("rolex");
    });
  }, [items]);

  // Reset Rolex box option if all Rolex watches are removed
  useEffect(() => {
    if (!hasRolexInCart && includeOgRolexBox) {
      setIncludeOgRolexBox(false);
    }
  }, [hasRolexInCart, includeOgRolexBox]);

  // Load cart and preferences from localStorage on mount with strict sanitization
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem("dappersfit_cart");
      if (storedItems) {
        const parsed = JSON.parse(storedItems);
        if (Array.isArray(parsed)) {
          const sanitized: CartItem[] = parsed
            .filter((it: unknown): it is Record<string, unknown> => Boolean(it && typeof it === "object"))
            .map((it) => {
              const id = String(it.id || Math.random());
              const brand = String(it.brand || "Luxury");
              const name = String(it.name || "Timepiece");
              const imageUrl = typeof it.imageUrl === "string" ? it.imageUrl : null;
              const rawPrice = Number(it.price) || 0;
              const price = normalizeProductPrice({
                id,
                name,
                brand,
                price: rawPrice,
                imageUrl,
              });
              return {
                id,
                name,
                brand,
                price,
                imageUrl,
                quantity: Math.max(1, Number(it.quantity) || 1),
              };
            });
          setItems(sanitized);
        }
      }
      const storedPromo = localStorage.getItem("dappersfit_promo");
      if (storedPromo) {
        setAppliedPromo(JSON.parse(storedPromo));
      }
      const storedShipping = localStorage.getItem("dappersfit_shipping");
      if (storedShipping === "express" || storedShipping === "standard") {
        setShippingMethod(storedShipping);
      }
      const storedBox = localStorage.getItem("dappersfit_rolex_box");
      if (storedBox === "true") {
        setIncludeOgRolexBox(true);
      }
    } catch (e) {
      console.error("Could not load cart from localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("dappersfit_cart", JSON.stringify(items));
    } catch (e) {
      console.error("Could not save cart to localStorage", e);
    }
  }, [items, isLoaded]);

  // Save Rolex box preference
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("dappersfit_rolex_box", includeOgRolexBox ? "true" : "false");
    } catch (e) {
      console.error("Could not save rolex box to localStorage", e);
    }
  }, [includeOgRolexBox, isLoaded]);

  // Save promo code to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (appliedPromo) {
        localStorage.setItem("dappersfit_promo", JSON.stringify(appliedPromo));
      } else {
        localStorage.removeItem("dappersfit_promo");
      }
    } catch (e) {
      console.error("Could not save promo to localStorage", e);
    }
  }, [appliedPromo, isLoaded]);

  // Save shipping method to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("dappersfit_shipping", shippingMethod);
    } catch (e) {
      console.error("Could not save shipping to localStorage", e);
    }
  }, [shippingMethod, isLoaded]);

  const addToCart = (
    product: {
      id: string | number;
      name: string;
      brand?: string;
      price: number | string;
      imageUrl?: string | null;
    },
    quantity: number = 1
  ) => {
    const pId = String(product.id);
    const pBrand = String(product.brand || "Luxury");
    const pName = String(product.name || "Timepiece");
    const numPrice = normalizeProductPrice({
      id: pId,
      name: pName,
      brand: pBrand,
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl || null,
    });
    const numQty = Math.max(1, Number(quantity) || 1);

    setItems((prev) => {
      const existing = prev.find((item) => String(item.id) === pId);
      if (existing) {
        return prev.map((item) =>
          String(item.id) === pId
            ? { ...item, quantity: item.quantity + numQty }
            : item
        );
      }
      return [
        ...prev,
        {
          id: pId,
          name: pName,
          brand: pBrand,
          price: numPrice,
          imageUrl: product.imageUrl || null,
          quantity: numQty,
        },
      ];
    });

    // Show temporary toast message
    setToastMessage(`✓ Added ${pBrand} - ${pName} to your cart!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const removeFromCart = (id: string | number) => {
    const sId = String(id);
    setItems((prev) => prev.filter((item) => String(item.id) !== sId));
  };

  const updateQuantity = (id: string | number, delta: number) => {
    const sId = String(id);
    setItems((prev) =>
      prev
        .map((item) => {
          if (String(item.id) === sId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setQuantity = (id: string | number, quantity: number) => {
    const sId = String(id);
    const safeQty = Math.floor(quantity);
    if (safeQty <= 0) {
      removeFromCart(sId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        String(item.id) === sId ? { ...item, quantity: Math.min(safeQty, 99) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
    setIncludeOgRolexBox(false);
    try {
      localStorage.removeItem("dappersfit_cart");
      localStorage.removeItem("dappersfit_promo");
      localStorage.removeItem("dappersfit_rolex_box");
    } catch {
      // ignore
    }
  };

  const toggleCart = () => setIsOpen((prev) => !prev);
  const clearToast = () => setToastMessage(null);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items]
  );

  const subtotal = useMemo(() => {
    const itemsSum = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const rolexBoxCost = includeOgRolexBox && hasRolexInCart ? ROLEX_OG_BOX_PRICE : 0;
    return itemsSum + rolexBoxCost;
  }, [items, includeOgRolexBox, hasRolexInCart]);

  // Re-verify promo eligibility if subtotal changes
  useEffect(() => {
    if (appliedPromo && appliedPromo.minOrder && subtotal < appliedPromo.minOrder) {
      setAppliedPromo(null);
    }
  }, [subtotal, appliedPromo]);

  const discountAmount = useMemo(() => {
    if (!appliedPromo || subtotal === 0) return 0;
    if (appliedPromo.type === "percent") {
      return Math.round((subtotal * appliedPromo.value) / 100);
    }
    if (appliedPromo.type === "flat") {
      return Math.min(subtotal, appliedPromo.value);
    }
    return 0;
  }, [appliedPromo, subtotal]);

  const shippingCost = shippingMethod === "express" ? 199 : 0;

  // 18% GST included transparency
  const taxAmount = useMemo(() => {
    if (subtotal === 0) return 0;
    return Math.round(subtotal - subtotal / 1.18);
  }, [subtotal]);

  const finalTotal = useMemo(() => {
    if (subtotal === 0) return 0;
    return Math.max(0, subtotal - discountAmount + shippingCost);
  }, [subtotal, discountAmount, shippingCost]);

  const applyPromoCode = (code: string): { success: boolean; message: string } => {
    const trimmed = (code || "").trim().toUpperCase();
    if (!trimmed) {
      return { success: false, message: "Please enter a promo code." };
    }
    if (items.length === 0) {
      return { success: false, message: "Cart is empty. Add watches first!" };
    }

    const found = AVAILABLE_PROMOS.find((p) => p.code.toUpperCase() === trimmed);
    if (!found) {
      return {
        success: false,
        message: `Promo code "${trimmed}" is not recognized. Try DAPPER10 or FLAT500.`,
      };
    }

    if (found.minOrder && subtotal < found.minOrder) {
      return {
        success: false,
        message: `Code "${found.code}" requires a minimum order of ₹${(found.minOrder).toLocaleString("en-IN")}. Add ₹${(found.minOrder - subtotal).toLocaleString("en-IN")} more!`,
      };
    }

    setAppliedPromo(found);
    return {
      success: true,
      message: `🎉 Promo code "${found.code}" applied successfully!`,
    };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        setQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        toggleCart,
        totalCount,
        subtotal,
        totalPrice: subtotal,
        shippingMethod,
        setShippingMethod,
        shippingCost,
        appliedPromo,
        discountAmount,
        applyPromoCode,
        removePromoCode,
        taxAmount,
        finalTotal,
        availablePromos: AVAILABLE_PROMOS,
        toastMessage,
        clearToast,
        includeOgRolexBox,
        setIncludeOgRolexBox,
        hasRolexInCart,
        rolexBoxPrice: ROLEX_OG_BOX_PRICE,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
