import { describe, it, expect } from "vitest";
import { priceSizeClass } from "./priceSize";

describe("priceSizeClass", () => {
  it("keeps the hero size up to five digits and steps down as the amount grows", () => {
    expect(priceSizeClass(1_250)).toBe("text-6xl");
    expect(priceSizeClass(12_999)).toBe("text-6xl");
    expect(priceSizeClass(131_000)).toBe("text-5xl");
    expect(priceSizeClass(13_099_999)).toBe("text-5xl");
    expect(priceSizeClass(131_000_493)).toBe("text-4xl");
    expect(priceSizeClass(9_007_199_254_740_991)).toBe("text-3xl");
  });
});
