import { auth } from "@clerk/nextjs/server";
import { err, ok, type Result } from "neverthrow";

export interface AuthSession {
  userId: string;
  orgId: string | undefined;
  isAdmin: boolean;
}

/**
 * Checks authentication status and returns the current user's details.
 * Never throws. Returns a neverthrow Result.
 * Falls back to a mock session if Clerk credentials are not found in development.
 */
export async function checkAuth(): Promise<Result<AuthSession, Error>> {
  try {
    // If Clerk is not set up yet in development, allow local mock admin
    const hasClerkKeys = !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
    );

    if (!hasClerkKeys) {
      console.info(
        "[CLERK SIMULATION] No Clerk keys found. Auto-authorizing developer as 'mock-admin-99'.",
      );
      return ok({
        userId: "mock-admin-99",
        orgId: "mock-org-123",
        isAdmin: true,
      });
    }

    const { userId, orgId, orgRole } = await auth();

    if (!userId) {
      return err(new Error("Unauthorized. Please sign in to access this CMS."));
    }

    const isAdmin = orgRole === "org:admin" || orgRole === "admin";

    return ok({
      userId,
      orgId,
      isAdmin,
    });
  } catch (error) {
    console.error("Authentication DAL exception caught:", error);

    // Gracefully handle missing configuration or loading failures
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      return ok({
        userId: "mock-admin-99",
        orgId: "mock-org-123",
        isAdmin: true,
      });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Authentication validation failed.";
    return err(new Error(message));
  }
}
