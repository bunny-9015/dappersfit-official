"use server";

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  hashPassword,
  verifyPassword,
  setSession,
  getCurrentSession,
  clearSession,
} from "@/lib/auth";

export async function submitWatchRequest(formData: FormData) {
  const brand = formData.get("brand") as String;
  const otherBrand = formData.get("otherBrand") as String;
  
  const finalBrand = brand === "Other" && otherBrand ? otherBrand : brand;

  try {
    await prisma.watchRequest.create({
      data: {
        fullName: formData.get("fullName") as string,
        email: formData.get("email") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        whatsappNumber: formData.get("whatsappNumber") as string,
        brand: finalBrand as string,
        modelName: formData.get("modelName") as string,
        referenceNumber: formData.get("referenceNumber") as string,
        productUrl: formData.get("productUrl") as string,
        budgetRange: formData.get("budgetRange") as string,
        condition: formData.get("condition") as string,
        timeline: formData.get("timeline") as string,
        dialColor: formData.get("dialColor") as string,
        strapPreference: formData.get("strapPreference") as string,
        materialPreference: formData.get("materialPreference") as string,
        specialRequirements: formData.get("specialRequirements") as string,
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error saving request:", error);
    return { success: false, error: "Failed to submit request" };
  }
}

export async function saveCategory(data: { id?: string; name: string; imageUrl?: string | null }) {
  try {
    const name = String(data.name || "").trim();
    if (!name) return { success: false, error: "Catalog name is required." };
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `cat-${Date.now()}`;
    const imageUrl = data.imageUrl ? String(data.imageUrl).trim() : null;

    const category = data.id
      ? await prisma.category.update({
          where: { id: data.id },
          data: { name, slug, imageUrl },
        })
      : await prisma.category.upsert({
          where: { name },
          update: { imageUrl },
          create: { name, slug, imageUrl },
        });

    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/admin/products");
    return { success: true, category };
  } catch (error: any) {
    console.error("saveCategory error:", error);
    return { success: false, error: error?.message || "Failed to save catalog." };
  }
}

export async function addCategory(name: string) {
  return saveCategory({ name });
}

export async function saveProduct(data: {
  id?: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  categoryId?: string;
  newCategory?: string;
  images: string[];
  inStock: boolean;
  quantity: number;
  preBookingAvailable?: boolean;
  expectedDeliveryDate?: string | null;
}) {
  try {
    const name = String(data.name || "").trim();
    const brand = String(data.brand || "").trim();
    const price = Number(data.price);
    const description = String(data.description || "").trim();

    if (!name || !brand || isNaN(price) || price <= 0) {
      return { success: false, error: "Name, brand, and a valid price are required." };
    }

    let categoryId = String(data.categoryId || "").trim();
    if (!categoryId || categoryId === "new") {
      const catName = String(data.newCategory || brand).trim();
      const slug = catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `cat-${Date.now()}`;
      const existing = await prisma.category.findFirst({
        where: { OR: [{ name: catName }, { slug }] },
      });
      if (existing) {
        categoryId = existing.id;
      } else {
        const created = await prisma.category.create({ data: { name: catName, slug } });
        categoryId = created.id;
      }
    }

    const cleanImages = (Array.isArray(data.images) ? data.images : [])
      .map((u) => String(u || "").trim())
      .filter(Boolean)
      .slice(0, 10);
    const primaryImage = cleanImages[0] || null;
    const expectedDate = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null;

    const payload = {
      name,
      brand,
      price,
      description: description || `${brand} ${name}`,
      imageUrl: primaryImage,
      images: cleanImages,
      categoryId,
      inStock: Boolean(data.inStock),
      quantity: Math.max(0, Number(data.quantity) || 0),
      preBookingAvailable: Boolean(data.preBookingAvailable),
      expectedDeliveryDate: expectedDate && !isNaN(expectedDate.getTime()) ? expectedDate : null,
    };

    const product = data.id
      ? await prisma.product.update({
          where: { id: data.id },
          data: payload,
          include: { category: true },
        })
      : await prisma.product.create({
          data: payload,
          include: { category: true },
        });

    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/admin/products");
    return { success: true, product };
  } catch (error: any) {
    console.error("saveProduct error:", error);
    return { success: false, error: error?.message || "Failed to save product." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("deleteProduct error:", error);
    return { success: false, error: error?.message || "Failed to delete product." };
  }
}

export async function toggleProductStock(id: string, inStock: boolean) {
  try {
    await prisma.product.update({ where: { id }, data: { inStock } });
    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update stock." };
  }
}

export async function addProduct(formData: FormData) {
  return saveProduct({
    name: String(formData.get("name") || ""),
    brand: String(formData.get("brand") || ""),
    price: parseFloat(String(formData.get("price") || "0")),
    description: String(formData.get("description") || ""),
    categoryId: String(formData.get("categoryId") || "new"),
    newCategory: String(formData.get("newCategory") || ""),
    images: String(formData.get("imageUrl") || "") ? [String(formData.get("imageUrl"))] : [],
    inStock: formData.get("inStock") === "on",
    quantity: parseInt(String(formData.get("quantity") || "1"), 10) || 1,
  });
}

export async function createOrder(data: {
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  subtotal: number;
  discountAmount?: number;
  promoCode?: string;
  shippingCost?: number;
  shippingMethod?: string;
  taxAmount?: number;
  totalAmount: number;
  items: Array<{
    productId?: string;
    productName: string;
    brand: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
  }>;
}) {
  try {
    const session = await getCurrentSession();
    const finalUserId = data.userId || session?.userId || null;

    const order = await prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        userId: finalUserId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        shippingAddress: data.shippingAddress,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        paymentMethod: data.paymentMethod || "cod",
        paymentStatus: data.paymentStatus || (data.paymentMethod === "cod" ? "pending" : "paid"),
        orderStatus: "Pending",
        subtotal: data.subtotal,
        discountAmount: data.discountAmount || 0,
        promoCode: data.promoCode || null,
        shippingCost: data.shippingCost || 0,
        shippingMethod: data.shippingMethod || "standard",
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            brand: item.brand,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { success: true, order };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  orderSnapshot?: {
    orderNumber: string;
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    totalAmount?: number;
    notes?: string | null;
  }
) {
  try {
    const existing = await prisma.order.findFirst({
      where: orderSnapshot?.orderNumber
        ? { OR: [{ id: orderId }, { orderNumber: orderSnapshot.orderNumber }] }
        : { id: orderId },
    });

    if (existing) {
      await prisma.order.update({
        where: { id: existing.id },
        data: { orderStatus: newStatus },
      });
    } else if (orderSnapshot?.orderNumber) {
      // Persist status for YouPI-synced orders that weren't yet in Postgres
      await prisma.order.create({
        data: {
          orderNumber: orderSnapshot.orderNumber,
          customerName: orderSnapshot.customerName || "Online Customer",
          customerPhone: orderSnapshot.customerPhone || "—",
          shippingAddress: orderSnapshot.shippingAddress || "Synced from YouPI Gateway",
          paymentMethod: orderSnapshot.paymentMethod || "youpi_upi",
          paymentStatus: orderSnapshot.paymentStatus || "paid",
          orderStatus: newStatus,
          subtotal: Number(orderSnapshot.totalAmount || 0),
          totalAmount: Number(orderSnapshot.totalAmount || 0),
          notes: orderSnapshot.notes || null,
        },
      });
    }
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function deleteOrder(orderId: string, orderNumber?: string) {
  try {
    const existing = await prisma.order.findFirst({
      where: orderNumber ? { OR: [{ id: orderId }, { orderNumber }] } : { id: orderId },
    });

    if (existing) {
      // Tombstone with orderStatus="Deleted" so YouPI live sync never resurrects it on refresh
      await prisma.order.update({
        where: { id: existing.id },
        data: { orderStatus: "Deleted" },
      });
    } else if (orderNumber) {
      await prisma.order.create({
        data: {
          orderNumber,
          customerName: "Deleted Order",
          customerPhone: "—",
          shippingAddress: "—",
          paymentMethod: "youpi_upi",
          paymentStatus: "deleted",
          orderStatus: "Deleted",
          subtotal: 0,
          totalAmount: 0,
        },
      });
    }
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

// ----------------- AUTHENTICATION ACTIONS -----------------

const FALLBACK_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "dappersfit@gmail.com").trim().toLowerCase();
// scrypt hash of initial admin password (overrideable via ADMIN_PASSWORD env var)
const FALLBACK_ADMIN_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  hashPassword(process.env.ADMIN_PASSWORD || "Jail@1974");

export async function loginUser(data: { email: string; password: string }) {
  try {
    const email = data.email.trim().toLowerCase();

    // Master Admin check (works even if SQLite is unavailable/read-only on serverless)
    if (email === FALLBACK_ADMIN_EMAIL && verifyPassword(data.password, FALLBACK_ADMIN_HASH)) {
      const adminUser = {
        userId: "dappersfit-master-admin",
        email: FALLBACK_ADMIN_EMAIL,
        name: "DappersFit Admin",
        role: "ADMIN" as const,
      };
      await setSession(adminUser);
      revalidatePath("/");
      revalidatePath("/admin/orders");
      revalidatePath("/account");
      return {
        success: true,
        user: {
          id: adminUser.userId,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "No account found with this email." };
    }

    // Only the configured master admin email may hold ADMIN role
    if (user.role === "ADMIN" && email !== FALLBACK_ADMIN_EMAIL) {
      return { success: false, error: "This administrator account has been disabled." };
    }

    const isValid = verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "CUSTOMER" | "ADMIN",
    });

    revalidatePath("/");
    revalidatePath("/admin/orders");
    revalidatePath("/account");

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Login failed:", error);
    return { success: false, error: "An unexpected error occurred during login." };
  }
}

export async function socialLoginUser(data: {
  provider: "google" | "instagram" | "facebook";
  email: string;
  name: string;
}) {
  try {
    const email = data.email.trim().toLowerCase();
    if (!email) {
      return { success: false, error: "Email is required for social login." };
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Auto-create customer account for social sign-in
      const randomSecret = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(randomSecret);

      user = await prisma.user.create({
        data: {
          name: data.name.trim() || `${data.provider.toUpperCase()} User`,
          email,
          passwordHash,
          role: "CUSTOMER",
        },
      });
    }

    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "CUSTOMER" | "ADMIN",
    });

    revalidatePath("/");
    revalidatePath("/admin/orders");
    revalidatePath("/account");

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Social sign-in failed:", error);
    return { success: false, error: "Failed to authenticate with social provider." };
  }
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountType?: "CUSTOMER" | "ADMIN";
  adminPasscode?: string;
}) {
  try {
    const email = data.email.trim().toLowerCase();

    if (!data.name || !email || !data.password) {
      return { success: false, error: "Name, email, and password are required." };
    }

    if (data.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: "An account already exists with this email." };
    }

    // Registration strictly creates CUSTOMER accounts.
    // The system permits exactly 1 master admin account (dappersfit@gmail.com).
    if (data.accountType === "ADMIN") {
      return {
        success: false,
        error: "Administrator account registration is disabled. Only 1 master admin account exists.",
      };
    }

    const finalRole: "CUSTOMER" | "ADMIN" = "CUSTOMER";

    const passwordHash = hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        pincode: data.pincode?.trim() || null,
        role: finalRole,
      },
    });

    await setSession({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: finalRole,
    });

    revalidatePath("/");
    revalidatePath("/account");
    if ((finalRole as string) === "ADMIN") {
      revalidatePath("/admin/orders");
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  } catch (error) {
    console.error("Registration failed:", error);
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

export async function logoutUser() {
  try {
    await clearSession();
    revalidatePath("/");
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Logout failed:", error);
    return { success: false, error: "Failed to logout." };
  }
}

export async function getUserSession() {
  return await getCurrentSession();
}

export async function updateUserProfile(data: {
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, error: "You must be logged in to update profile." };
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
      },
    });

    revalidatePath("/account");
    return { success: true, user: updated };
  } catch (error) {
    console.error("Update profile failed:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

