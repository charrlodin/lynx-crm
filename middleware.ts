import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/pipeline(.*)",
  "/leads(.*)",
  "/tasks(.*)",
  "/lists(.*)",
  "/import(.*)",
  "/settings(.*)",
]);

const isLandingPage = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Redirect signed-in users from landing page to dashboard
  if (isLandingPage(req) && userId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  // Protect dashboard routes
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
