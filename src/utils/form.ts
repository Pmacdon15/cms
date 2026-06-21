/**
 * Safely extracts error messages from TanStack Form field error state.
 * Standard Schema / Zod validation often returns error objects instead of strings.
 */
export function getFieldError(errors: unknown[]): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  return errors
    .map((err) => {
      if (typeof err === "object" && err !== null && "message" in err) {
        return (err as { message: string }).message;
      }
      return String(err);
    })
    .join(", ");
}
