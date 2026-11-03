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

export async function addCategory(name: string) {
  try {
    await prisma.category.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/ /g, '-'),
      }
    });
    revalidatePath("/catalog");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function addProduct(formData: FormData) {
  try {
    let categoryId = formData.get("categoryId") as string;
    
    // Auto-create category if "new_category" is used
    if (!categoryId || categoryId === "new") {
      const newCatName = formData.get("newCategory") as string || formData.get("brand") as string;
      const cat = await prisma.category.upsert({
        where: { name: newCatName },
        update: {},
        create: { name: newCatName, slug: newCatName.toLowerCase().replace(/ /g, '-') }
      });
      categoryId = cat.id;
    }

    await prisma.product.create({
      data: {
        name: formData.get("name") as string,
        brand: formData.get("brand") as string,
        price: parseFloat(formData.get("price") as string),
        description: formData.get("description") as string,
        categoryId: categoryId,
        inStock: formData.get("inStock") === "on",
        quantity: parseInt(formData.get("quantity") as string) || 1,
      }
    });
    revalidatePath("/catalog");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
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

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: newStatus },
    });
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await prisma.order.delete({
      where: { id: orderId },
    });
    revalidatePath("/admin/orders");
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

// ----------------- AUTHENTICATION ACTIONS -----------------

export async function loginUser(data: { email: string; password: string }) {
  try {
    const email = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "No account found with this email." };
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
    // The system permits exactly 1 master admin account (admindappersfit@gmail.com).
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

