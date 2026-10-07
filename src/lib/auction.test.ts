import { describe, it, expect } from "vitest";
import {
  createAuction,
  derive,
  isBidderId,
  STARTING_PRICE,
  MIN_INCREMENT,
  DEFAULT_DURATION_MS,
  type Auction,
  type Ctx,
  type Bid,
} from "./auction";

export function ctxAt(now: number): Ctx {
  let n = 0;
  return { now, newId: () => `id-${++n}` };
}

export function bid(partial: Partial<Bid> & Pick<Bid, "bidder" | "amount">): Bid {
  return {
    id: partial.id ?? `b-${partial.amount}`,
    at: partial.at ?? 0,
    cancelled: partial.cancelled ?? false,
    ...partial,
  };
}

describe("isBidderId", () => {
  it("accepts the three bidders and rejects everything else", () => {
    expect(isBidderId("gaspar")).toBe(true);
    expect(isBidderId("agustin")).toBe(true);
    expect(isBidderId("belen")).toBe(true);
    expect(isBidderId("Gaspar")).toBe(false);
    expect(isBidderId("toString")).toBe(false);
    expect(isBidderId(42)).toBe(false);
  });
});

describe("createAuction", () => {
  it("starts live for the default duration with no bids", () => {
    const a = createAuction(ctxAt(1_000));
    expect(a.id).toBe("id-1");
    expect(a.version).toBe(1);
    expect(a.startingPrice).toBe(STARTING_PRICE);
    expect(a.minIncrement).toBe(MIN_INCREMENT);
    expect(a.endsAt).toBe(1_000 + DEFAULT_DURATION_MS);
    expect(a.bids).toEqual([]);
  });

  it("accepts a custom duration", () => {
    expect(createAuction(ctxAt(0), 5_000).endsAt).toBe(5_000);
  });
});

describe("derive", () => {
  const base: Auction = {
    id: "a",
    version: 1,
    startingPrice: 1200,
    minIncrement: 50,
    endsAt: 10_000,
    bids: [],
  };

  it("with no bids: starting price, no leader, minimum is the starting price", () => {
    const d = derive(base, 0);
    expect(d.currentPrice).toBe(1200);
    expect(d.leader).toBeNull();
    expect(d.topBid).toBeNull();
    expect(d.minimumBid).toBe(1200);
    expect(d.status).toBe("live");
    expect(d.remainingMs).toBe(10_000);
  });

  it("with bids: top active bid wins, minimum is top plus increment", () => {
    const a = {
      ...base,
      bids: [bid({ bidder: "gaspar", amount: 1200 }), bid({ bidder: "agustin", amount: 1300 })],
    };
    const d = derive(a, 0);
    expect(d.currentPrice).toBe(1300);
    expect(d.leader).toBe("agustin");
    expect(d.minimumBid).toBe(1350);
    expect(d.activeBids).toHaveLength(2);
  });

  it("ignores cancelled bids: cancelling the top bid lowers the price", () => {
    const a = {
      ...base,
      bids: [
        bid({ bidder: "gaspar", amount: 1200 }),
        bid({ bidder: "agustin", amount: 1300, cancelled: true }),
      ],
    };
    const d = derive(a, 0);
    expect(d.currentPrice).toBe(1200);
    expect(d.leader).toBe("gaspar");
  });

  it("cancelling a middle bid keeps the top bid", () => {
    const a = {
      ...base,
      bids: [
        bid({ bidder: "gaspar", amount: 1200, cancelled: true }),
        bid({ bidder: "agustin", amount: 1300 }),
      ],
    };
    expect(derive(a, 0).currentPrice).toBe(1300);
  });

  it("is ended at exactly endsAt and remaining never goes negative", () => {
    expect(derive(base, 9_999).status).toBe("live");
    expect(derive(base, 10_000).status).toBe("ended");
    expect(derive(base, 20_000).remainingMs).toBe(0);
  });
});

import { reduce } from "./auction";

describe("reduce", () => {
  const live = (): Auction => ({
    id: "a",
    version: 3,
    startingPrice: 1200,
    minIncrement: 50,
    endsAt: 100_000,
    bids: [],
  });

  describe("BID_PLACED", () => {
    it("accepts an opening bid equal to the starting price", () => {
      const r = reduce(
        live(),
        { type: "BID_PLACED", bidder: "gaspar", amount: 1200 },
        ctxAt(1_000),
      );
      expect(r.ok).toBe(true);
      expect(r.state.version).toBe(4);
      expect(r.state.bids).toEqual([
        { id: "id-1", bidder: "gaspar", amount: 1200, at: 1_000, cancelled: false },
      ]);
    });

    it("rejects an opening bid below the starting price", () => {
      const r = reduce(live(), { type: "BID_PLACED", bidder: "gaspar", amount: 1150 }, ctxAt(0));
      expect(r).toMatchObject({ ok: false, reason: "Minimum bid is $1,200" });
      expect(r.state.version).toBe(3);
    });

    it("requires at least the increment above the top active bid", () => {
      const a = { ...live(), bids: [bid({ bidder: "gaspar", amount: 1200 })] };
      expect(
        reduce(a, { type: "BID_PLACED", bidder: "agustin", amount: 1249 }, ctxAt(0)),
      ).toMatchObject({ ok: false, reason: "Minimum bid is $1,250" });
      expect(reduce(a, { type: "BID_PLACED", bidder: "agustin", amount: 1250 }, ctxAt(0)).ok).toBe(
        true,
      );
      expect(
        reduce(a, { type: "BID_PLACED", bidder: "agustin", amount: 9_000_000 }, ctxAt(0)).ok,
      ).toBe(true);
    });

    it("lets the leader raise their own bid", () => {
      const a = { ...live(), bids: [bid({ bidder: "gaspar", amount: 1200 })] };
      expect(reduce(a, { type: "BID_PLACED", bidder: "gaspar", amount: 1250 }, ctxAt(0)).ok).toBe(
        true,
      );
    });

    it("rejects non-integer amounts", () => {
      expect(
        reduce(live(), { type: "BID_PLACED", bidder: "gaspar", amount: 1250.5 }, ctxAt(0)),
      ).toMatchObject({ ok: false, reason: "Minimum bid is $1,200" });
      expect(
        reduce(live(), { type: "BID_PLACED", bidder: "gaspar", amount: Number.NaN }, ctxAt(0)).ok,
      ).toBe(false);
    });

    it("rejects bids at or after endsAt", () => {
      expect(
        reduce(live(), { type: "BID_PLACED", bidder: "gaspar", amount: 1200 }, ctxAt(100_000)),
      ).toMatchObject({ ok: false, reason: "Auction has ended" });
      expect(
        reduce(live(), { type: "BID_PLACED", bidder: "gaspar", amount: 1200 }, ctxAt(99_999)).ok,
      ).toBe(true);
    });
  });

  describe("BID_CANCELLED", () => {
    it("marks the bid cancelled and bumps the version", () => {
      const a = { ...live(), bids: [bid({ id: "x", bidder: "gaspar", amount: 1200 })] };
      const r = reduce(a, { type: "BID_CANCELLED", bidId: "x" }, ctxAt(0));
      expect(r.ok).toBe(true);
      expect(r.state.bids[0].cancelled).toBe(true);
      expect(r.state.version).toBe(4);
    });

    it("rejects unknown and already cancelled bids", () => {
      const a = {
        ...live(),
        bids: [bid({ id: "x", bidder: "gaspar", amount: 1200, cancelled: true })],
      };
      expect(reduce(a, { type: "BID_CANCELLED", bidId: "nope" }, ctxAt(0))).toMatchObject({
        ok: false,
        reason: "Bid not found",
      });
      expect(reduce(a, { type: "BID_CANCELLED", bidId: "x" }, ctxAt(0))).toMatchObject({
        ok: false,
        reason: "Bid already cancelled",
      });
    });

    it("works after the auction has ended", () => {
      const a = { ...live(), bids: [bid({ id: "x", bidder: "gaspar", amount: 1200 })] };
      expect(reduce(a, { type: "BID_CANCELLED", bidId: "x" }, ctxAt(500_000)).ok).toBe(true);
    });
  });

  describe("TIMER_ADJUSTED", () => {
    it("adds and removes time", () => {
      expect(
        reduce(live(), { type: "TIMER_ADJUSTED", deltaMs: 30_000 }, ctxAt(0)).state.endsAt,
      ).toBe(130_000);
      expect(
        reduce(live(), { type: "TIMER_ADJUSTED", deltaMs: -30_000 }, ctxAt(0)).state.endsAt,
      ).toBe(70_000);
    });

    it("never ends in the past: a large negative delta ends the auction now", () => {
      const r = reduce(live(), { type: "TIMER_ADJUSTED", deltaMs: -500_000 }, ctxAt(60_000));
      expect(r.state.endsAt).toBe(60_000);
      expect(derive(r.state, 60_000).status).toBe("ended");
    });

    it("reopens an ended auction from now", () => {
      const r = reduce(live(), { type: "TIMER_ADJUSTED", deltaMs: 30_000 }, ctxAt(200_000));
      expect(r.state.endsAt).toBe(230_000);
    });

    it("rejects non-integer deltas", () => {
      expect(reduce(live(), { type: "TIMER_ADJUSTED", deltaMs: 1.5 }, ctxAt(0))).toMatchObject({
        ok: false,
        reason: "Invalid adjustment",
      });
    });
  });

  describe("RESET", () => {
    it("starts a fresh auction with a new id and a higher version", () => {
      const a = { ...live(), bids: [bid({ bidder: "gaspar", amount: 1200 })] };
      const r = reduce(a, { type: "RESET" }, ctxAt(5_000));
      expect(r.ok).toBe(true);
      expect(r.state.id).toBe("id-1");
      expect(r.state.id).not.toBe(a.id);
      expect(r.state.version).toBe(4);
      expect(r.state.bids).toEqual([]);
      expect(r.state.endsAt).toBe(5_000 + DEFAULT_DURATION_MS);
    });

    it("honours a positive integer duration and rejects anything else", () => {
      expect(reduce(live(), { type: "RESET", durationMs: 10_000 }, ctxAt(0)).state.endsAt).toBe(
        10_000,
      );
      expect(reduce(live(), { type: "RESET", durationMs: 0 }, ctxAt(0))).toMatchObject({
        ok: false,
        reason: "Invalid duration",
      });
      expect(reduce(live(), { type: "RESET", durationMs: 2.5 }, ctxAt(0))).toMatchObject({
        ok: false,
        reason: "Invalid duration",
      });
    });
  });

  it("rejections return the same state object", () => {
    const a = live();
    const r = reduce(a, { type: "BID_CANCELLED", bidId: "nope" }, ctxAt(0));
    expect(r.state).toBe(a);
  });
});
