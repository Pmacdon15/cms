export function parseParams(
  p: string | string[] | undefined,
  type?: "string",
): string;
export function parseParams(
  p: string | string[] | undefined,
  type: "number",
): number;
export function parseParams(
  p: string | string[] | undefined,
  type: "string" | "number" = "string",
): string | number {
  return type === "string"
    ? Array.isArray(p)
      ? (p[0] ?? "")
      : (p ?? "")
    : Number(Array.isArray(p) ? (p[0] ?? 1) : (p ?? 1));
}
