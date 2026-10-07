import { describe, it, expect } from "vitest";
import { MemoryStore, RedisStore, ConflictError, AUCTION_KEY, type RedisLike } from "./store";
import type { Ctx } from "./auction";

function ctxFactory(): () => Ctx {
  let n = 0;
  return () => ({ now: 1_000, newId: () => `id-${++n}` });
}

/** Emulates the Lua compare-and-swap faithfully, with optional scripted results. */
function fakeRedis(
  scripted: number[] = [],
): RedisLike & { data: Map<string, string>; calls: number } {
  const data = new Map<string, string>();
  const queue = [...scripted];
  const fake = {
    data,
    calls: 0,
    async get(key: string) {
      return data.get(key) ?? null;
    },
    async eval(_script: string, keys: string[], args: (string | number)[]) {
      fake.calls++;
      if (queue.length) {
        const r = queue.shift()!;
        if (r === 1) data.set(keys[0], String(args[1]));
        return r;
      }
      const cur = data.get(keys[0]) ?? null;
      if ((cur === null && args[0] === "") || cur === args[0]) {
        data.set(keys[0], String(args[1]));
        return 1;
      }
      return 0;
    },
  };
  return fake;
}

describe("MemoryStore", () => {
  it("creates the auction once and returns the same one afterwards", async () => {
    const s = new MemoryStore(ctxFactory());
    const a = await s.read();
    const b = await s.read();
    expect(a).toBe(b);
    expect(a.id).toBe("id-1");
  });

  it("transact writes the result and null writes nothing", async () => {
    const s = new MemoryStore(ctxFactory());
    const before = await s.read();
    const unchanged = await s.transact(() => null);
    expect(unchanged).toBe(before);
    const after = await s.transact((st) => ({ ...st, version: st.version + 1 }));
    expect(after.version).toBe(2);
    expect(await s.read()).toBe(after);
  });
});

describe("RedisStore", () => {
  it("read creates and persists a fresh auction when the key is missing", async () => {
    const redis = fakeRedis();
    const s = new RedisStore(redis, ctxFactory());
    const a = await s.read();
    expect(a.id).toBe("id-1");
    expect(JSON.parse(redis.data.get(AUCTION_KEY)!)).toEqual(a);
    expect((await s.read()).id).toBe("id-1");
  });

  it("transact applies fn under compare-and-swap", async () => {
    const redis = fakeRedis();
    const s = new RedisStore(redis, ctxFactory());
    await s.read();
    const next = await s.transact((st) => ({ ...st, version: st.version + 1 }));
    expect(next.version).toBe(2);
    expect(JSON.parse(redis.data.get(AUCTION_KEY)!).version).toBe(2);
  });

  it("transact with null does not write", async () => {
    const redis = fakeRedis();
    const s = new RedisStore(redis, ctxFactory());
    await s.read();
    const callsBefore = redis.calls;
    await s.transact(() => null);
    expect(redis.calls).toBe(callsBefore);
  });

  it("retries once on a lost race and succeeds", async () => {
    const redis = fakeRedis();
    const s = new RedisStore(redis, ctxFactory());
    await s.read();
    const racy = fakeRedis([0, 1]);
    racy.data.set(AUCTION_KEY, redis.data.get(AUCTION_KEY)!);
    const s2 = new RedisStore(racy, ctxFactory());
    const next = await s2.transact((st) => ({ ...st, version: st.version + 1 }));
    expect(next.version).toBe(2);
    expect(racy.calls).toBe(2);
  });

  it("throws ConflictError after three lost races", async () => {
    const redis = fakeRedis([0, 0, 0]);
    redis.data.set(
      AUCTION_KEY,
      JSON.stringify({
        id: "a",
        version: 1,
        startingPrice: 1200,
        minIncrement: 50,
        endsAt: 9,
        bids: [],
      }),
    );
    const s = new RedisStore(redis, ctxFactory());
    await expect(s.transact((st) => ({ ...st, version: 2 }))).rejects.toBeInstanceOf(ConflictError);
  });

  it('treats a string "1" from the script as success', async () => {
    const redis = fakeRedis();
    const original = redis.eval.bind(redis);
    redis.eval = async (...a) => String(await original(...a));
    const s = new RedisStore(redis, ctxFactory());
    expect((await s.read()).id).toBe("id-1");
  });
});
