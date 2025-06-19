import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to public routes
    if (pathname === "/" || pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.includes("favicon")) {
      return NextResponse.next();
    }

    // Allow access to auth pages when not authenticated
    if (pathname.startsWith("/auth/") && !token) {
      return NextResponse.next();
    }

    // Redirect to signin if trying to access protected routes without auth
    if (!token && (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/organizations") ||
      pathname.startsWith("/tickets") ||
      pathname.startsWith("/sprints") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/project")
    )) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Redirect authenticated users away from auth pages
    if (token && pathname.startsWith("/auth/")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/health") ||
          pathname.startsWith("/api/test") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon")
        ) {
          return true;
        }

        // Allow access to auth pages
        if (pathname.startsWith("/auth/")) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
