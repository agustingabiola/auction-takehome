import { describe, it, expect } from "vitest";
import { computeOffset } from "./clock";

describe("computeOffset", () => {
  it("is server minus client", () => {
    expect(computeOffset(10_000, 9_000)).toBe(1_000);
    expect(computeOffset(9_000, 10_000)).toBe(-1_000);
  });
});
