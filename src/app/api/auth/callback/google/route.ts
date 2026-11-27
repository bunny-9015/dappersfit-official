import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSession, hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = new URL(request.url).origin;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || origin}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_oauth_pending", request.url));
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/login?error=oauth_token_failed", request.url));
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    const email = profile.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.redirect(new URL("/login?error=no_email", request.url));
    }

    // 3. Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const randomSecret = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(randomSecret);

      user = await prisma.user.create({
        data: {
          name: profile.name || "Google User",
          email,
          passwordHash,
          role: "CUSTOMER",
        },
      });
    }

    // 4. Set encrypted session cookie
    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "CUSTOMER" | "ADMIN",
    });

    const stateDest = searchParams.get("state") || "";
    const safeStateDest = stateDest.startsWith("/") && !stateDest.startsWith("//") ? stateDest : "";
    const dest = user.role === "ADMIN" ? "/admin/orders" : (safeStateDest || "/account");
    return NextResponse.redirect(new URL(dest, request.url));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=oauth_error", request.url));
  }
}
