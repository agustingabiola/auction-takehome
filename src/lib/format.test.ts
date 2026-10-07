import { describe, it, expect } from "vitest";
import { formatMoney, formatClock, clockSeconds, formatRelative } from "./format";

describe("formatMoney", () => {
  it("formats whole dollars with grouping", () => {
    expect(formatMoney(950)).toBe("$950");
    expect(formatMoney(1250)).toBe("$1,250");
    expect(formatMoney(1_000_000)).toBe("$1,000,000");
  });
});

describe("clock", () => {
  it("rounds up to the next second so it reaches 0:00 exactly at the end", () => {
    expect(clockSeconds(180_000)).toBe(180);
    expect(clockSeconds(2_999)).toBe(3);
    expect(clockSeconds(1)).toBe(1);
    expect(clockSeconds(0)).toBe(0);
    expect(clockSeconds(-5)).toBe(0);
  });

  it("formats m:ss", () => {
    expect(formatClock(180_000)).toBe("3:00");
    expect(formatClock(65_000)).toBe("1:05");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(600_000)).toBe("10:00");
  });
});

describe("formatRelative", () => {
  it("describes how long ago", () => {
    expect(formatRelative(500)).toBe("just now");
    expect(formatRelative(12_000)).toBe("12s ago");
    expect(formatRelative(180_000)).toBe("3m ago");
  });
});
