import { connection } from "next/server";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import OrdersManager from "@/components/admin/OrdersManager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await connection();

  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 pb-20">
      {/* Top Admin Nav */}
      <AdminNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif tracking-tight">
              Orders Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Live incoming customer orders, dispatch status, tracking, and tax invoice generation.
            </p>
          </div>
        </div>

        {/* Interactive Orders Dashboard */}
        <OrdersManager initialOrders={orders} />
      </main>
    </div>
  );
}
