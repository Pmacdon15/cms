import { describe, it, expect } from "vitest";
import { getFieldError } from "./form";

describe("getFieldError", () => {
  it("returns undefined for empty or missing errors", () => {
    expect(getFieldError([])).toBeUndefined();
    expect(getFieldError(undefined as unknown as unknown[])).toBeUndefined();
  });

  it("extracts message from error objects", () => {
    expect(
      getFieldError([{ message: "Name is required" }, { message: "Too long" }]),
    ).toBe("Name is required, Too long");
  });

  it("stringifies non-object errors", () => {
    expect(getFieldError(["plain string error"])).toBe("plain string error");
  });

  it("handles mixed error shapes", () => {
    expect(
      getFieldError([{ message: "Zod error" }, "string error", 42]),
    ).toBe("Zod error, string error, 42");
  });
});
