import { describe, expect, it } from "vitest";
import { parseParams } from "./params";

describe("parseParams", () => {
  it("returns empty string for undefined string param", () => {
    expect(parseParams(undefined)).toBe("");
    expect(parseParams(undefined, "string")).toBe("");
  });

  it("returns first element of string array", () => {
    expect(parseParams(["hello", "world"])).toBe("hello");
  });

  it("returns the string itself when not array", () => {
    expect(parseParams("solo")).toBe("solo");
  });

  it("parses number from string", () => {
    expect(parseParams("42", "number")).toBe(42);
  });

  it("defaults number to 1 when undefined", () => {
    expect(parseParams(undefined, "number")).toBe(1);
  });

  it("parses first element of number array", () => {
    expect(parseParams(["7", "9"], "number")).toBe(7);
  });

  it("returns NaN for non-numeric string when type is number", () => {
    expect(Number.isNaN(parseParams("abc", "number"))).toBe(true);
  });
});
