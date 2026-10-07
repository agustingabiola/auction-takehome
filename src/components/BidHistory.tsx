"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BIDDERS, type Bid, type BidderId } from "@/lib/auction";
import { formatMoney, formatRelative } from "@/lib/format";
import { base, reducedFade, STAGGER_S } from "./motion";

type Props = { bids: Bid[]; now: number; me: BidderId | null; limit?: number };

export function BidHistory({ bids, now, me, limit = 5 }: Props) {
  const reduced = useReducedMotion();
  const recent = [...bids].reverse().slice(0, limit);
  return (
    <section>
      <h2 className="mb-2 text-xs text-ink-soft">Recent bids</h2>
      {recent.length === 0 && <p className="text-sm text-ink-soft">No bids yet</p>}
      <ul className="space-y-1">
        <AnimatePresence initial={false}>
          {recent.map((b, i) => (
            <motion.li
              key={b.id}
              layout
              initial={{ opacity: 0, y: reduced ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ ...(reduced ? reducedFade : base), delay: reduced ? 0 : i * STAGGER_S }}
              className={`flex items-baseline justify-between text-sm ${b.cancelled ? "text-ink-soft line-through" : ""}`}
            >
              <span>
                {b.bidder === me ? "You" : BIDDERS[b.bidder].name}
                {b.cancelled && <span className="ml-2 no-underline text-xs">cancelled</span>}
              </span>
              <span className="tabular-nums">
                {formatMoney(b.amount)}{" "}
                <span className="text-xs text-ink-soft">{formatRelative(now - b.at)}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
