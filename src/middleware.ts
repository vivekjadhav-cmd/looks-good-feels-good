import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/home",
  "/wardrobe",
  "/style-me",
  "/outfit",
  "/calendar",
  "/profile",
  "/onboarding",
];

const PUBLIC_ROUTES = ["/", "/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/style-me", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
