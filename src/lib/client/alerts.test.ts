import { describe, it, expect } from "vitest";
import { deriveAlerts } from "./alerts";
import type { Bid, Snapshot } from "@/lib/auction";

const bid = (id: string, bidder: Bid["bidder"], amount: number, cancelled = false): Bid => ({
  id,
  bidder,
  amount,
  at: 0,
  cancelled,
});
const snap = (bids: Bid[], id = "a", version = 1): Snapshot => ({
  auction: { id, version, startingPrice: 1200, minIncrement: 50, endsAt: 999_999, bids },
  now: 0,
});

describe("deriveAlerts", () => {
  it("returns nothing for the first snapshot", () => {
    expect(deriveAlerts(null, snap([]), "bob", "remote")).toEqual([]);
  });

  it("outbid: I was leading and someone else leads now", () => {
    const prev = snap([bid("1", "bob", 1200)]);
    const next = snap([bid("1", "bob", 1200), bid("2", "alice", 1250)], "a", 2);
    expect(deriveAlerts(prev, next, "bob", "remote")).toEqual([
      { kind: "outbid", by: "alice", amount: 1250 },
    ]);
  });

  it("cancelled: one of my bids became cancelled, and that is not reported as outbid", () => {
    const prev = snap([bid("1", "alice", 1200), bid("2", "bob", 1250)]);
    const next = snap([bid("1", "alice", 1200), bid("2", "bob", 1250, true)], "a", 2);
    expect(deriveAlerts(prev, next, "bob", "remote")).toEqual([
      { kind: "cancelled", amount: 1250 },
    ]);
  });

  it("leading again: someone above me was cancelled, only when not my own dispatch", () => {
    const prev = snap([bid("1", "bob", 1200), bid("2", "alice", 1250)]);
    const next = snap([bid("1", "bob", 1200), bid("2", "alice", 1250, true)], "a", 2);
    expect(deriveAlerts(prev, next, "bob", "remote")).toEqual([
      { kind: "leading-again", by: "alice" },
    ]);
    expect(deriveAlerts(prev, next, "bob", "self")).toEqual([]);
  });

  it("my own accepted bid produces no alert", () => {
    const prev = snap([bid("1", "alice", 1200)]);
    const next = snap([bid("1", "alice", 1200), bid("2", "bob", 1250)], "a", 2);
    expect(deriveAlerts(prev, next, "bob", "self")).toEqual([]);
  });

  it("restarted: a new auction id reports only the restart", () => {
    const prev = snap([bid("1", "bob", 1200)]);
    const next = snap([], "b", 2);
    expect(deriveAlerts(prev, next, "bob", "remote")).toEqual([{ kind: "restarted" }]);
    expect(deriveAlerts(prev, next, null, "remote")).toEqual([{ kind: "restarted" }]);
  });

  it("the auctioneer (me = null) only ever sees restarts", () => {
    const prev = snap([bid("1", "bob", 1200)]);
    const next = snap([bid("1", "bob", 1200), bid("2", "alice", 1250)], "a", 2);
    expect(deriveAlerts(prev, next, null, "remote")).toEqual([]);
  });
});
