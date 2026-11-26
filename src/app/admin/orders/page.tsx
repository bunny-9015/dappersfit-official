import { connection } from "next/server";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import OrdersManager, { OrderData } from "@/components/admin/OrdersManager";
import { YOUPI_API_URL, YOUPI_MERCHANT_ID, YOUPI_ADMIN_TOKEN } from "@/lib/youpi";

export const dynamic = "force-dynamic";

async function fetchLiveYoupiOrders(): Promise<OrderData[]> {
  try {
    const res = await fetch(
      `${YOUPI_API_URL}/api/v1/admin/payments?merchantId=${encodeURIComponent(YOUPI_MERCHANT_ID)}&limit=100`,
      {
        headers: { Authorization: `Bearer ${YOUPI_ADMIN_TOKEN}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const payments = Array.isArray(data?.payments) ? data.payments : [];

    return payments.map((p: any): OrderData => {
      const meta = p.metadata && typeof p.metadata === "object" ? p.metadata : {};
      const paidAmount = Number(p.amountPaise || 0) / 100;
      const isCodAdvance = meta.paymentMode === "COD_ADVANCE";
      const totalAmount = Number(meta.orderTotal || paidAmount || 0);
      const balanceDue = isCodAdvance ? Number(meta.codBalanceDue ?? Math.max(0, totalAmount - paidAmount)) : 0;

      const statusUpper = String(p.status || "").toUpperCase();
      const isPaid =
        statusUpper === "OBSERVED_SUCCESS" ||
        statusUpper === "RECONCILED" ||
        statusUpper === "SUCCESS";
      const isCancelled =
        statusUpper === "CANCELLED" ||
        statusUpper === "EXPIRED" ||
        statusUpper === "FAILED";

      const paymentStatus = isPaid
        ? isCodAdvance
          ? "partial_paid"
          : "paid"
        : isCancelled
        ? "failed"
        : "pending";
      const orderStatus = isPaid ? "Confirmed" : isCancelled ? "Cancelled" : "Pending";

      const rawItems = Array.isArray(meta.items) ? meta.items : [];
      const items =
        rawItems.length > 0
          ? rawItems.map((it: any, idx: number) => ({
              id: `${p.id}-item-${idx}`,
              orderId: p.id,
              productId: null,
              productName: String(it.name || "Luxury Timepiece"),
              brand: String(it.brand || "DappersFit"),
              price: Number(it.price || paidAmount),
              quantity: Number(it.qty || it.quantity || 1),
              imageUrl: null,
            }))
          : [
              {
                id: `${p.id}-item-0`,
                orderId: p.id,
                productId: null,
                productName: `YouPI Order #${p.orderId}`,
                brand: "DappersFit",
                price: totalAmount,
                quantity: 1,
                imageUrl: null,
              },
            ];

      const notesParts = [
        `YouPI ${p.status}`,
        p.verificationTag && p.verificationTag !== "UNVERIFIED" ? p.verificationTag : "",
        isCodAdvance ? `COD Advance ₹${paidAmount} | Balance ₹${balanceDue} on delivery` : "",
        meta.includeOgRolexBox ? "+ OG Rolex Box" : "",
      ].filter(Boolean);

      return {
        id: String(p.id),
        orderNumber: String(p.orderId || p.id),
        customerName: String(meta.customerName || "Online Customer"),
        customerPhone: String(meta.customerPhone || "—"),
        customerEmail: null,
        shippingAddress: String(meta.shippingAddress || "Synced from YouPI Gateway"),
        city: null,
        state: null,
        pincode: null,
        paymentMethod: isCodAdvance ? "cod_advance" : String(p.method || "youpi_upi").toLowerCase(),
        paymentStatus,
        orderStatus,
        subtotal: totalAmount,
        discountAmount: 0,
        promoCode: null,
        shippingCost: 0,
        shippingMethod: "standard",
        taxAmount: Math.round((totalAmount * 18) / 118),
        totalAmount,
        notes: notesParts.join(" • "),
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.completedAt || p.createdAt || new Date().toISOString(),
        items,
      };
    });
  } catch (err) {
    console.error("[AdminOrdersPage] YouPI live sync failed:", err);
    return [];
  }
}

export default async function AdminOrdersPage() {
  await connection();

  const [dbOrders, youpiOrders] = await Promise.all([
    prisma.order
      .findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
      })
      .catch((err) => {
        console.warn("[AdminOrdersPage] Local DB read skipped:", err);
        return [] as OrderData[];
      }),
    fetchLiveYoupiOrders(),
  ]);

  // Track tombstoned deleted orderNumbers so YouPI sync never resurrects them
  const deletedOrderNumbers = new Set<string>();
  const mergedMap = new Map<string, OrderData>();
  for (const o of dbOrders) {
    if (o.orderStatus === "Deleted") {
      deletedOrderNumbers.add(o.orderNumber);
      continue;
    }
    mergedMap.set(o.orderNumber, o);
  }
  for (const y of youpiOrders) {
    if (deletedOrderNumbers.has(y.orderNumber)) continue;
    const existing = mergedMap.get(y.orderNumber);
    if (existing) {
      mergedMap.set(y.orderNumber, {
        ...existing,
        paymentStatus: y.paymentStatus !== "pending" ? y.paymentStatus : existing.paymentStatus,
        orderStatus: existing.orderStatus !== "Pending" ? existing.orderStatus : y.orderStatus,
        notes: y.notes || existing.notes,
      });
    } else {
      mergedMap.set(y.orderNumber, y);
    }
  }

  const orders = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
              Live incoming customer orders synced with YouPI Gateway, dispatch status, and invoices.
            </p>
          </div>
        </div>

        {/* Interactive Orders Dashboard */}
        <OrdersManager initialOrders={orders} />
      </main>
    </div>
  );
}
