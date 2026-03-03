import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as any)?.role;

  if (pathname.startsWith("/dashboard") && role === "COORDINATOR") {
    return NextResponse.redirect(new URL("/coordinator/dashboard", req.url));
  }

  if (pathname.startsWith("/coordinator") && role !== "COORDINATOR" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/coordinator/:path*"],
};