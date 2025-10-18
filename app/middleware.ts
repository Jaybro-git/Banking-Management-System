import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value || null;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicPaths = ["/login", "/register", "/register-branch"];

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Verify token with backend
  let isValidToken = false;
  if (token) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://btrust-backend-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/auth/verify`, {
        method: "GET",
        headers: {
          "Cookie": `accessToken=${token}`,
        },
        credentials: "include",
      });
      isValidToken = response.status === 200;
    } catch (err) {
      console.error("Token verification failed:", err);
      isValidToken = false;
    }
  }

  // If user is authenticated and trying to access public routes (login/register), redirect to dashboard
  if (isValidToken && isPublicPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isValidToken && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};