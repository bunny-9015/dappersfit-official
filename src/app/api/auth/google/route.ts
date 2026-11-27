import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const reqUrl = new URL(request.url);
  const origin = reqUrl.origin;
  const redirectAfter = reqUrl.searchParams.get("redirect") || "/account";
  const safeRedirect = redirectAfter.startsWith("/") ? redirectAfter : "/account";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || origin}/api/auth/callback/google`;

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_oauth_pending", request.url));
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent("openid email profile")}&state=${encodeURIComponent(safeRedirect)}&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}
