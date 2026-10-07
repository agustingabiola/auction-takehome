import { describe, it, expect } from "vitest";
import { parseEvent } from "./auction";

describe("parseEvent", () => {
  it("accepts each valid shape", () => {
    expect(parseEvent({ type: "RESET" })).toEqual({ type: "RESET" });
    expect(parseEvent({ type: "RESET", durationMs: 5000 })).toEqual({
      type: "RESET",
      durationMs: 5000,
    });
    expect(parseEvent({ type: "BID_PLACED", bidder: "bob", amount: 1250 })).toEqual({
      type: "BID_PLACED",
      bidder: "bob",
      amount: 1250,
    });
    expect(parseEvent({ type: "BID_CANCELLED", bidId: "x" })).toEqual({
      type: "BID_CANCELLED",
      bidId: "x",
    });
    expect(parseEvent({ type: "TIMER_ADJUSTED", deltaMs: -30000 })).toEqual({
      type: "TIMER_ADJUSTED",
      deltaMs: -30000,
    });
  });

  it("strips unknown fields", () => {
    expect(parseEvent({ type: "BID_PLACED", bidder: "bob", amount: 1250, admin: true })).toEqual({
      type: "BID_PLACED",
      bidder: "bob",
      amount: 1250,
    });
  });

  it("rejects garbage", () => {
    expect(parseEvent(null)).toBeNull();
    expect(parseEvent("RESET")).toBeNull();
    expect(parseEvent({ type: "NOPE" })).toBeNull();
    expect(parseEvent({ type: "BID_PLACED", bidder: "eve", amount: 1250 })).toBeNull();
    expect(parseEvent({ type: "BID_PLACED", bidder: "bob", amount: "1250" })).toBeNull();
    expect(parseEvent({ type: "BID_CANCELLED", bidId: "" })).toBeNull();
    expect(parseEvent({ type: "TIMER_ADJUSTED" })).toBeNull();
    expect(parseEvent({ type: "RESET", durationMs: "5000" })).toBeNull();
  });
});
