import { describe, it, expect } from "vitest";
import { formatSnapshotEvent, HEARTBEAT, RETRY_LINE } from "./sse";

describe("sse framing", () => {
  it("frames a snapshot as a named event with one data line", () => {
    const out = formatSnapshotEvent({
      auction: { id: "a", version: 1, startingPrice: 1200, minIncrement: 50, endsAt: 5, bids: [] },
      now: 3,
    });
    expect(out.startsWith("event: snapshot\ndata: ")).toBe(true);
    expect(out.endsWith("\n\n")).toBe(true);
    expect(JSON.parse(out.slice("event: snapshot\ndata: ".length, -2))).toMatchObject({ now: 3 });
    expect(out.split("\n")).toHaveLength(4);
  });

  it("heartbeat is a comment and retry is a field", () => {
    expect(HEARTBEAT).toBe(": hb\n\n");
    expect(RETRY_LINE).toBe("retry: 1000\n\n");
  });
});
