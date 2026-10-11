import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import { ACCESS_FEATURE } from "@/utils/plan";

// Match pages that require user login
const isProtectedRoute = createRouteMatcher([
  // "/",
  "/clients(.*)",
  "/campaigns(.*)",
  "/mailing-lists(.*)",
  "/unsubscribe(.*)",
]);

// App areas that also require an active plan (the `cms_access` feature).
// Server actions POST to these same paths, so they are covered too.
const isPlanGatedRoute = createRouteMatcher([
  "/",
  "/clients(.*)",
  "/campaigns(.*)",
  "/mailing-lists(.*)",
]);

const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  return clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect();
    }

    if (hasClerkKeys && isPlanGatedRoute(request)) {
      const { userId, orgId, has } = await auth();
      // Signed-out visitors on "/" still see the landing page.
      if (userId && (!orgId || !has({ feature: ACCESS_FEATURE }))) {
        return NextResponse.redirect(new URL("/pricing", request.url));
      }
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
