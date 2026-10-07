import { connection } from "next/server";
import { getStore } from "@/lib/store";
import { formatSnapshotEvent, HEARTBEAT, RETRY_LINE } from "@/lib/sse";

// Next 16 with Cache Components: no `dynamic` segment export; `connection()` opts the GET into request-time rendering.
export const maxDuration = 300;

const POLL_MS = 250;
const HEARTBEAT_MS = 15_000;
const LIFETIME_MS = 290_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  await connection();
  const store = getStore();
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const started = Date.now();
      let lastWrite = 0;
      let lastKey = "";
      const write = (text: string) => {
        controller.enqueue(encoder.encode(text));
        lastWrite = Date.now();
      };
      try {
        write(RETRY_LINE);
        while (!cancelled && !request.signal.aborted && Date.now() - started < LIFETIME_MS) {
          const auction = await store.read();
          const key = `${auction.id}:${auction.version}`;
          if (key !== lastKey) {
            lastKey = key;
            write(formatSnapshotEvent({ auction, now: Date.now() }));
          } else if (Date.now() - lastWrite >= HEARTBEAT_MS) {
            write(HEARTBEAT);
          }
          await sleep(POLL_MS);
        }
      } catch {
        // store failure or client gone: fall through and close; the browser reconnects
      }
      try {
        controller.close();
      } catch {
        // already closed
      }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
