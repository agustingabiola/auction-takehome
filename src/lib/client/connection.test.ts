import { describe, it, expect } from "vitest";
import { nextMode, shouldAccept } from "./connection";
import type { Auction } from "@/lib/auction";

const a = (id: string, version: number): Auction => ({
  id,
  version,
  startingPrice: 1200,
  minIncrement: 50,
  endsAt: 0,
  bids: [],
});

describe("nextMode", () => {
  it("hidden wins, ended polls, otherwise streams", () => {
    expect(nextMode(false, "live")).toBe("hidden");
    expect(nextMode(false, null)).toBe("hidden");
    expect(nextMode(true, "ended")).toBe("idle-poll");
    expect(nextMode(true, "live")).toBe("streaming");
    expect(nextMode(true, null)).toBe("streaming");
  });
});

describe("shouldAccept", () => {
  it("accepts anything when there is no current snapshot", () => {
    expect(shouldAccept(null, a("x", 1))).toBe(true);
  });
  it("accepts a higher version of the same auction", () => {
    expect(shouldAccept(a("x", 2), a("x", 3))).toBe(true);
  });
  it("ignores the same or a lower version of the same auction", () => {
    expect(shouldAccept(a("x", 3), a("x", 3))).toBe(false);
    expect(shouldAccept(a("x", 3), a("x", 2))).toBe(false);
  });
  it("accepts a different auction id regardless of version", () => {
    expect(shouldAccept(a("x", 9), a("y", 1))).toBe(true);
  });
});
