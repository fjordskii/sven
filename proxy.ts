import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAllowedEmail, isPublicPath } from "@/lib/authz";

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const allowed = isAllowedEmail(req.auth?.user?.email);

  if (pathname.startsWith("/api/")) {
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (!allowed) {
    return NextResponse.redirect(new URL("/denied", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
