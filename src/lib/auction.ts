export type BidderId = "gaspar" | "agustin" | "belen";

export const BIDDERS: Record<BidderId, { name: string }> = {
  agustin: { name: "Agustin" },
  belen: { name: "Belen" },
  gaspar: { name: "Gaspar" },
};

export const BIDDER_IDS = Object.keys(BIDDERS) as BidderId[];

export function isBidderId(v: unknown): v is BidderId {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(BIDDERS, v);
}

export const STARTING_PRICE = 1200;
export const MIN_INCREMENT = 50;
export const DEFAULT_DURATION_MS = 3 * 60_000;
export const TIMER_STEP_MS = 30_000;
export const BID_EXTENSION_MS = 30_000;
export const SOFT_CLOSE_MS = 15_000;

export const PROPERTY = {
  title: "214 Maple Street",
  subtitle: "3 bed · 2 bath · 1,840 sq ft · Austin, TX",
};

export type Bid = {
  id: string;
  bidder: BidderId;
  amount: number;
  at: number;
  cancelled: boolean;
};

export type Auction = {
  id: string;
  version: number;
  startingPrice: number;
  minIncrement: number;
  endsAt: number;
  bids: Bid[];
};

export type Snapshot = { auction: Auction; now: number };

export type AuctionEvent =
  | { type: "RESET"; durationMs?: number }
  | { type: "BID_PLACED"; bidder: BidderId; amount: number }
  | { type: "BID_CANCELLED"; bidId: string }
  | { type: "TIMER_ADJUSTED"; deltaMs: number };

export type Ctx = { now: number; newId: () => string };

export type ReduceResult =
  | { ok: true; state: Auction }
  | { ok: false; reason: string; state: Auction };

export type Derived = {
  status: "live" | "ended";
  remainingMs: number;
  activeBids: Bid[];
  topBid: Bid | null;
  currentPrice: number;
  leader: BidderId | null;
  minimumBid: number;
};

export function createAuction(ctx: Ctx, durationMs: number = DEFAULT_DURATION_MS): Auction {
  return {
    id: ctx.newId(),
    version: 1,
    startingPrice: STARTING_PRICE,
    minIncrement: MIN_INCREMENT,
    endsAt: ctx.now + durationMs,
    bids: [],
  };
}

export function derive(state: Auction, now: number): Derived {
  const activeBids = state.bids.filter((b) => !b.cancelled);
  let topBid: Bid | null = null;
  for (const b of activeBids) {
    if (topBid === null || b.amount > topBid.amount) topBid = b;
  }
  const currentPrice = topBid ? topBid.amount : state.startingPrice;
  return {
    status: now < state.endsAt ? "live" : "ended",
    remainingMs: Math.max(0, state.endsAt - now),
    activeBids,
    topBid,
    currentPrice,
    leader: topBid ? topBid.bidder : null,
    minimumBid: topBid ? topBid.amount + state.minIncrement : state.startingPrice,
  };
}

function money(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export function reduce(state: Auction, event: AuctionEvent, ctx: Ctx): ReduceResult {
  const reject = (reason: string): ReduceResult => ({ ok: false, reason, state });

  switch (event.type) {
    case "RESET": {
      const d = event.durationMs;
      if (d !== undefined && !(Number.isInteger(d) && d > 0)) return reject("Invalid duration");
      const fresh = createAuction(ctx, d);
      return { ok: true, state: { ...fresh, version: state.version + 1 } };
    }
    case "BID_PLACED": {
      const d = derive(state, ctx.now);
      if (d.status === "ended") return reject("Auction has ended");
      if (!Number.isInteger(event.amount) || event.amount < d.minimumBid) {
        return reject(`Minimum bid is ${money(d.minimumBid)}`);
      }
      const placed: Bid = {
        id: ctx.newId(),
        bidder: event.bidder,
        amount: event.amount,
        at: ctx.now,
        cancelled: false,
      };
      return {
        ok: true,
        state: {
          ...state,
          version: state.version + 1,
          endsAt: state.endsAt + BID_EXTENSION_MS,
          bids: [...state.bids, placed],
        },
      };
    }
    case "BID_CANCELLED": {
      const target = state.bids.find((b) => b.id === event.bidId);
      if (!target) return reject("Bid not found");
      if (target.cancelled) return reject("Bid already cancelled");
      const bids = state.bids.map((b) => (b.id === event.bidId ? { ...b, cancelled: true } : b));
      return { ok: true, state: { ...state, version: state.version + 1, bids } };
    }
    case "TIMER_ADJUSTED": {
      if (!Number.isInteger(event.deltaMs)) return reject("Invalid adjustment");
      const base = Math.max(state.endsAt, ctx.now);
      const endsAt = Math.max(ctx.now, base + event.deltaMs);
      return { ok: true, state: { ...state, version: state.version + 1, endsAt } };
    }
    default: {
      const never: never = event;
      void never;
      return reject("Unknown event");
    }
  }
}

export function parseEvent(input: unknown): AuctionEvent | null {
  if (typeof input !== "object" || input === null) return null;
  const o = input as Record<string, unknown>;
  switch (o.type) {
    case "RESET":
      if (o.durationMs === undefined) return { type: "RESET" };
      return typeof o.durationMs === "number" ? { type: "RESET", durationMs: o.durationMs } : null;
    case "BID_PLACED":
      return isBidderId(o.bidder) && typeof o.amount === "number"
        ? { type: "BID_PLACED", bidder: o.bidder, amount: o.amount }
        : null;
    case "BID_CANCELLED":
      return typeof o.bidId === "string" && o.bidId.length > 0
        ? { type: "BID_CANCELLED", bidId: o.bidId }
        : null;
    case "TIMER_ADJUSTED":
      return typeof o.deltaMs === "number" ? { type: "TIMER_ADJUSTED", deltaMs: o.deltaMs } : null;
    default:
      return null;
  }
}
