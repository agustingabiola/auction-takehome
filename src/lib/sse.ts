import type { Snapshot } from "./auction";

export const HEARTBEAT = ": hb\n\n";
export const RETRY_LINE = "retry: 1000\n\n";

export function formatSnapshotEvent(snapshot: Snapshot): string {
  return `event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`;
}
