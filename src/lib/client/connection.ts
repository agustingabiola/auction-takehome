import type { Auction } from "@/lib/auction";

export type Mode = "hidden" | "streaming" | "idle-poll";

export function nextMode(visible: boolean, status: "live" | "ended" | null): Mode {
  if (!visible) return "hidden";
  if (status === "ended") return "idle-poll";
  return "streaming";
}

export function shouldAccept(current: Auction | null, incoming: Auction): boolean {
  if (current === null) return true;
  return incoming.id !== current.id || incoming.version > current.version;
}
