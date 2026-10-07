import { Redis } from "@upstash/redis";
import { createAuction, type Auction, type Ctx } from "./auction";

export interface Store {
  read(): Promise<Auction>;
  transact(fn: (state: Auction) => Auction | null): Promise<Auction>;
}

export class ConflictError extends Error {
  constructor() {
    super("Conflict");
    this.name = "ConflictError";
  }
}

/** Production uses `auction`; local dev sets AUCTION_KEY=auction:dev so it never touches the live auction. */
export const AUCTION_KEY = process.env.AUCTION_KEY ?? "auction";
export const AUCTION_TTL_SECONDS = 3600;
const ATTEMPTS = 3;

export const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[1])
if (cur == false and ARGV[1] == '') or cur == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
  return 1
end
return 0
`;

export function serverCtx(): Ctx {
  return { now: Date.now(), newId: () => crypto.randomUUID() };
}

export type RedisLike = {
  get(key: string): Promise<string | null>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
};

export class MemoryStore implements Store {
  private state: Auction | null = null;
  constructor(private readonly ctx: () => Ctx = serverCtx) {}

  async read(): Promise<Auction> {
    if (this.state === null) this.state = createAuction(this.ctx());
    return this.state;
  }

  async transact(fn: (state: Auction) => Auction | null): Promise<Auction> {
    const current = await this.read();
    const next = fn(current);
    if (next !== null) this.state = next;
    return this.state as Auction;
  }
}

export class RedisStore implements Store {
  constructor(
    private readonly redis: RedisLike,
    private readonly ctx: () => Ctx = serverCtx,
  ) {}

  private async cas(expected: string, next: string): Promise<boolean> {
    const r = await this.redis.eval(
      CAS_SCRIPT,
      [AUCTION_KEY],
      [expected, next, AUCTION_TTL_SECONDS],
    );
    return r === 1 || r === "1";
  }

  async read(): Promise<Auction> {
    for (let i = 0; i < ATTEMPTS; i++) {
      const raw = await this.redis.get(AUCTION_KEY);
      if (raw !== null) return JSON.parse(raw) as Auction;
      const fresh = createAuction(this.ctx());
      if (await this.cas("", JSON.stringify(fresh))) return fresh;
    }
    throw new ConflictError();
  }

  async transact(fn: (state: Auction) => Auction | null): Promise<Auction> {
    for (let i = 0; i < ATTEMPTS; i++) {
      const raw = await this.redis.get(AUCTION_KEY);
      if (raw === null) {
        await this.cas("", JSON.stringify(createAuction(this.ctx())));
        continue;
      }
      const state = JSON.parse(raw) as Auction;
      const next = fn(state);
      if (next === null) return state;
      if (await this.cas(raw, JSON.stringify(next))) return next;
    }
    throw new ConflictError();
  }
}

function fromUpstash(redis: Redis): RedisLike {
  return {
    get: (key) => redis.get<string>(key),
    eval: (script, keys, args) => redis.eval(script, keys, args),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __auctionStore: Store | undefined;
}

export function getStore(): Store {
  if (globalThis.__auctionStore) return globalThis.__auctionStore;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  let store: Store;
  if (url && token) {
    store = new RedisStore(fromUpstash(new Redis({ url, token, automaticDeserialization: false })));
  } else if (process.env.VERCEL) {
    throw new Error("Upstash environment variables are missing in this deployment");
  } else {
    console.warn(
      "[auction] No Upstash variables found; using the in-memory store for local development",
    );
    store = new MemoryStore();
  }
  globalThis.__auctionStore = store;
  return store;
}
