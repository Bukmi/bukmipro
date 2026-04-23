import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PRIVATE_PREFIXES = ["/dashboard", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (!session && isPrivate) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname =
      session.user.onboardingStatus === "COMPLETED"
        ? "/dashboard"
        : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (
    session &&
    pathname.startsWith("/dashboard") &&
    session.user.onboardingStatus !== "COMPLETED"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)).*)",
  ],
};
