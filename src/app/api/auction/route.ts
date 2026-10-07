import { connection, NextResponse } from "next/server";
import { parseEvent, reduce, type ReduceResult } from "@/lib/auction";
import { ConflictError, getStore, serverCtx } from "@/lib/store";

// Next 16 with Cache Components: no `dynamic` segment export; `connection()` opts the GET into request-time rendering.
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  await connection();
  try {
    const auction = await getStore().read();
    return NextResponse.json({ auction, now: Date.now() }, { headers });
  } catch {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const event = parseEvent(body);
  if (!event) return NextResponse.json({ error: "Invalid event" }, { status: 400, headers });

  const ctx = serverCtx();
  const holder: { result?: ReduceResult } = {};
  try {
    const auction = await getStore().transact((state) => {
      holder.result = reduce(state, event, ctx);
      return holder.result.ok ? holder.result.state : null;
    });
    const result = holder.result;
    if (result && !result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason, auction, now: Date.now() },
        { headers },
      );
    }
    return NextResponse.json({ ok: true, auction, now: Date.now() }, { headers });
  } catch (e) {
    if (e instanceof ConflictError)
      return NextResponse.json({ error: "Conflict" }, { status: 409, headers });
    return NextResponse.json({ error: "Store unavailable" }, { status: 503, headers });
  }
}
