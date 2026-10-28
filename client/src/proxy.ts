import { NextResponse, type NextRequest } from "next/server";

// Only checks that the cookie exists, to skip rendering for logged-out users.
// The real check (valid token, correct role) happens in Express and in each page.
export function proxy(request: NextRequest) {
  if (request.cookies.has("auth")) {
    return NextResponse.next();
  }

  const loginPath = request.nextUrl.pathname.startsWith("/admin")
    ? "/admin/login"
    : "/login";
  return NextResponse.redirect(new URL(loginPath, request.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/dashboard/:path*"],
};
