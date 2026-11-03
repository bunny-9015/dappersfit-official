"use client";

import React from "react";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  theme?: "dark" | "light"; // dark = white main text, light = dark neutral main text
  showOriginal?: boolean;
  showBadge?: boolean;
  className?: string;
}

export interface SplitPriceResult {
  prefix: string; // e.g., "₹3,3"
  gradientDigit: string; // e.g., "0" (second-last digit)
  suffix: string; // e.g., "0" (final digit)
  decimalPart: string; // e.g., "" or ".50"
}

export function formatPriceSplit(price: number): SplitPriceResult {
  if (typeof price !== "number" || isNaN(price)) {
    return { prefix: "₹", gradientDigit: "", suffix: "0", decimalPart: "" };
  }

  const hasDecimals = price % 1 !== 0;
  let intFormatted: string;
  let decimalPart = "";

  if (hasDecimals) {
    const fixed = price.toFixed(2);
    const [intStr, decStr] = fixed.split(".");
    intFormatted = Number(intStr).toLocaleString("en-IN");
    decimalPart = `.${decStr}`;
  } else {
    intFormatted = Math.round(price).toLocaleString("en-IN");
  }

  // Safe handling for prices with fewer than 2 digits
  if (intFormatted.length === 0) {
    return { prefix: "₹", gradientDigit: "", suffix: "0", decimalPart };
  }

  if (intFormatted.length === 1) {
    return {
      prefix: "₹",
      gradientDigit: "",
      suffix: intFormatted,
      decimalPart,
    };
  }

  if (intFormatted.length === 2) {
    return {
      prefix: "₹",
      gradientDigit: intFormatted[0],
      suffix: intFormatted[1],
      decimalPart,
    };
  }

  // 3 or more characters (e.g., "300", "3,300", "14,999", "1,50,000")
  // Indian commas are always at least 3 digits from the end, so the last 2 characters are always digits
  const prefix = "₹" + intFormatted.slice(0, -2);
  const gradientDigit = intFormatted.slice(-2, -1);
  const suffix = intFormatted.slice(-1);

  return {
    prefix,
    gradientDigit,
    suffix,
    decimalPart,
  };
}

export function getCalculatedOriginalPrice(price: number): number {
  // Approximate standard luxury retail MRP (~30-35% markup, rounded nicely)
  const markup = price * 1.35;
  const rounded = Math.round(markup / 100) * 100;
  return rounded > price ? rounded - 1 : Math.round(price * 1.3);
}

export default function PriceTag({
  price,
  originalPrice,
  size = "md",
  theme = "dark",
  showOriginal = true,
  showBadge = false,
  className = "",
}: PriceTagProps) {
  const { prefix, gradientDigit, suffix, decimalPart } = formatPriceSplit(price);
  const calculatedOriginal = originalPrice ?? getCalculatedOriginalPrice(price);

  const sizeClasses = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
    xl: "text-3xl sm:text-4xl",
  }[size];

  const origSizeClasses = {
    xs: "text-[11px]",
    sm: "text-xs",
    md: "text-xs sm:text-sm",
    lg: "text-sm sm:text-base",
    xl: "text-base sm:text-lg",
  }[size];

  const mainColor = theme === "light" ? "text-neutral-900" : "text-white";
  const darkColorHex = theme === "light" ? "#171717" : "#ffffff";
  const redColorHex = "#c62828"; // Exact DappersFit crimson red

  const discountPercent = Math.max(
    10,
    Math.round(((calculatedOriginal - price) / calculatedOriginal) * 100)
  );

  return (
    <div className={`inline-flex items-baseline gap-2 flex-wrap ${className}`}>
      {/* 
        Typography-Styled Price:
        - Rupee symbol & main digits in dark/white color
        - Second-last digit has a smooth dark-to-red horizontal gradient blend
        - Final digit in vibrant crimson red
      */}
      <span className={`font-tech font-extrabold tracking-tight whitespace-nowrap inline-flex items-baseline ${sizeClasses}`}>
        {/* Rupee Symbol & Leading Digits */}
        <span className={mainColor}>{prefix}</span>

        {/* Second-to-last Digit: Smooth Red-to-Dark Transition Blend */}
        {gradientDigit && (
          <span
            className="inline-block align-baseline"
            style={{
              background: `linear-gradient(90deg, ${darkColorHex} 0%, ${redColorHex} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: redColorHex,
            }}
          >
            {gradientDigit}
          </span>
        )}

        {/* Final Digit: Solid Crimson Red */}
        <span
          className="inline-block align-baseline"
          style={{ color: redColorHex }}
        >
          {suffix}
        </span>

        {/* Optional Decimal Part (if any) */}
        {decimalPart && (
          <span
            className="inline-block align-baseline text-[0.85em]"
            style={{ color: redColorHex }}
          >
            {decimalPart}
          </span>
        )}
      </span>

      {/* Strikethrough Original MRP */}
      {showOriginal && calculatedOriginal > price && (
        <span className={`line-through text-gray-500 font-tech font-normal ${origSizeClasses}`}>
          ₹{calculatedOriginal.toLocaleString("en-IN")}
        </span>
      )}

      {/* Optional Savings Badge */}
      {showBadge && discountPercent > 0 && (
        <span className="text-[10px] font-tech font-bold text-[#c62828] bg-[#c62828]/15 border border-[#c62828]/30 px-1.5 py-0.5 rounded">
          {discountPercent}% OFF
        </span>
      )}
    </div>
  );
}
