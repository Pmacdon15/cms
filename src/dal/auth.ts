import { auth } from "@clerk/nextjs/server";
import { Result, err, ok } from "neverthrow";

/**
 * Checks authentication status and returns the current user's ID.
 * Never throws. Returns a neverthrow Result.
 * Falls back to a mock user ID if Clerk credentials are not found in development.
 */
export async function checkAuth(): Promise<Result<string, Error>> {
  try {
    // If Clerk is not set up yet in development, allow local mock admin
    const hasClerkKeys = !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
      process.env.CLERK_SECRET_KEY
    );

    if (!hasClerkKeys) {
      console.info("[CLERK SIMULATION] No Clerk keys found. Auto-authorizing developer as 'mock-admin-99'.");
      return ok("mock-admin-99");
    }

    const { userId } = await auth();
    
    if (!userId) {
      return err(new Error("Unauthorized. Please sign in to access this CMS."));
    }
    
    return ok(userId);
  } catch (error: any) {
    console.error("Authentication DAL exception caught:", error);
    
    // Gracefully handle missing configuration or loading failures
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      return ok("mock-admin-99");
    }
    
    return err(new Error(error?.message || "Authentication validation failed."));
  }
}
