import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import CustomerAccountClient from "@/components/CustomerAccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  await connection();
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?redirect=/account");
  }

  // Fetch full user data
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login?redirect=/account");
  }

  // Fetch orders associated with this user (by userId or matching email)
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: user.id },
        { customerEmail: user.email },
      ],
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <CustomerAccountClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            address: user.address,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
          }}
          orders={orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail,
            shippingAddress: o.shippingAddress,
            city: o.city,
            state: o.state,
            pincode: o.pincode,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus,
            subtotal: o.subtotal,
            discountAmount: o.discountAmount,
            promoCode: o.promoCode,
            shippingCost: o.shippingCost,
            shippingMethod: o.shippingMethod,
            taxAmount: o.taxAmount,
            totalAmount: o.totalAmount,
            createdAt: o.createdAt.toISOString(),
            items: o.items.map((i) => ({
              id: i.id,
              productName: i.productName,
              brand: i.brand,
              price: i.price,
              quantity: i.quantity,
              imageUrl: i.imageUrl,
            })),
          }))}
        />
      </div>
    </div>
  );
}
