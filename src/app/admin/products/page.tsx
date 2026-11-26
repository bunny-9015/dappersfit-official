import { connection } from "next/server";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import ProductsManager, { AdminCategoryItem, AdminProductItem } from "@/components/admin/ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  await connection();

  let categories: AdminCategoryItem[] = [];
  let products: AdminProductItem[] = [];
  let dbError: string | null = null;

  try {
    categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (err: any) {
    console.error("[AdminProducts] DB error:", err);
    dbError = "Could not load catalog from database. Verify DATABASE_URL is configured in Vercel.";
  }

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif tracking-tight">
            Catalog &amp; Inventory
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Add, edit, or delete watches, upload multiple product photos, and manage stock availability.
          </p>
        </div>

        {dbError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {dbError}
          </div>
        )}

        <ProductsManager initialProducts={products} initialCategories={categories} />
      </div>
    </div>
  );
}
