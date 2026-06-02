import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Detect if Clerk keys are present in the environment
const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

// Match pages that require user login
const isProtectedRoute = createRouteMatcher([
  "/",
  "/clients(.*)",
  "/campaigns(.*)",
]);

export default function middleware(req: NextRequest, event: any) {
  if (!hasClerkKeys) {
    // If Clerk is not set up, bypass routing protection
    return NextResponse.next();
  }

  // Otherwise, invoke real Clerk protection middleware
  return clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
  })(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
