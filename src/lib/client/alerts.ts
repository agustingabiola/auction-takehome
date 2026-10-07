import { derive, type BidderId, type Snapshot } from "@/lib/auction";

export type Alert =
  | { kind: "outbid"; by: BidderId; amount: number }
  | { kind: "cancelled"; amount: number }
  | { kind: "leading-again"; by: BidderId | null }
  | { kind: "restarted" };

export function deriveAlerts(
  prev: Snapshot | null,
  next: Snapshot,
  me: BidderId | null,
  source: "self" | "remote",
): Alert[] {
  if (prev === null) return [];
  if (next.auction.id !== prev.auction.id) return [{ kind: "restarted" }];
  if (me === null) return [];

  const alerts: Alert[] = [];
  const before = derive(prev.auction, prev.now);
  const after = derive(next.auction, next.now);
  const prevById = new Map(prev.auction.bids.map((b) => [b.id, b]));

  const newlyCancelled = next.auction.bids.filter(
    (b) => b.cancelled && prevById.get(b.id)?.cancelled === false,
  );
  const mineCancelled = newlyCancelled.find((b) => b.bidder === me);
  if (mineCancelled) alerts.push({ kind: "cancelled", amount: mineCancelled.amount });

  const lostLead = before.leader === me && after.leader !== me && after.leader !== null;
  if (lostLead && !mineCancelled)
    alerts.push({ kind: "outbid", by: after.leader as BidderId, amount: after.currentPrice });

  const gainedLead = before.leader !== me && after.leader === me;
  if (gainedLead && source === "remote") {
    const theirs = newlyCancelled.find((b) => b.bidder !== me);
    alerts.push({ kind: "leading-again", by: theirs ? theirs.bidder : null });
  }

  return alerts;
}
