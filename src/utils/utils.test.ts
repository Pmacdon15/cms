import { describe, expect, test } from "bun:test";
import { getFieldError } from "./form";
import { parseParams } from "./params";

describe("parseParams", () => {
  test("returns a string param as-is", () => {
    expect(parseParams("abc")).toBe("abc");
  });

  test("returns the first element of an array param", () => {
    expect(parseParams(["a", "b"])).toBe("a");
  });

  test("defaults to an empty string", () => {
    expect(parseParams(undefined)).toBe("");
    expect(parseParams([])).toBe("");
  });

  test("parses numbers and defaults to 1", () => {
    expect(parseParams("5", "number")).toBe(5);
    expect(parseParams(["7", "8"], "number")).toBe(7);
    expect(parseParams(undefined, "number")).toBe(1);
  });
});

describe("getFieldError", () => {
  test("returns undefined when there are no errors", () => {
    expect(getFieldError([])).toBeUndefined();
  });

  test("joins error messages and strings", () => {
    expect(getFieldError([{ message: "Too short" }, "Required"])).toBe("Too short, Required");
  });
});
