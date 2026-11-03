export interface BrandCategory {
  name: string;
  displayName: string;
  imageUrl: string;
  count: number;
}

export function formatBrandDisplayName(brand: string): string {
  const trimmed = (brand || "").trim();
  const map: Record<string, string> = {
    "G - shock": "G-Shock",
    "Michael kors": "Michael Kors",
    "Michael kors(Ladies)": "Michael Kors (Ladies)",
    "Fossil (LADIES)": "Fossil (Ladies)",
    "INVICTA": "Invicta",
    "Richard mille": "Richard Mille",
    "Diesel Big Daddy": "Diesel Big Daddy",
  };
  if (map[trimmed]) return map[trimmed];
  return trimmed;
}

/**
 * Derives unique brands, their model counts, and their representative watch photo
 * directly from the product catalogue without hardcoded lists.
 */
export function deriveBrandCategories(
  products: { id: string; name: string; brand: string; imageUrl: string | null }[]
): BrandCategory[] {
  const brandMap = new Map<string, { count: number; imageUrl: string }>();

  for (const p of products) {
    if (!p.brand) continue;
    const rawBrand = p.brand.trim();
    if (!rawBrand) continue;

    const existing = brandMap.get(rawBrand);
    if (!existing) {
      brandMap.set(rawBrand, {
        count: 1,
        imageUrl: p.imageUrl || "",
      });
    } else {
      existing.count += 1;
      // If previous entry had no image, update with this valid product image
      if (!existing.imageUrl && p.imageUrl) {
        existing.imageUrl = p.imageUrl;
      }
    }
  }

  // Curated luxury hierarchy for prominent brands, new additions append dynamically
  const luxuryOrder = [
    "Rolex",
    "Omega",
    "Patek Philippe",
    "Richard mille",
    "Hublot",
    "Rado",
    "Tissot",
    "Versace",
    "Carrera",
    "Casio",
    "G - shock",
    "Diesel",
    "Diesel Big Daddy",
    "Fossil",
    "Fossil (LADIES)",
    "Michael kors",
    "Michael kors(Ladies)",
    "INVICTA",
  ];

  const brandKeys = Array.from(brandMap.keys());
  brandKeys.sort((a, b) => {
    const idxA = luxuryOrder.findIndex((o) => o.toLowerCase() === a.toLowerCase());
    const idxB = luxuryOrder.findIndex((o) => o.toLowerCase() === b.toLowerCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return brandKeys.map((name) => {
    const info = brandMap.get(name)!;
    return {
      name,
      displayName: formatBrandDisplayName(name),
      imageUrl: info.imageUrl,
      count: info.count,
    };
  });
}
