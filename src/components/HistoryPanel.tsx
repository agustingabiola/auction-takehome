"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BIDDERS, type Bid } from "@/lib/auction";
import { formatMoney, formatRelative } from "@/lib/format";
import { base, reducedFade, STAGGER_S } from "./motion";

type Props = {
  open: boolean;
  bids: Bid[];
  now: number;
  onClose: () => void;
  onCancelBid: (bidId: string) => void;
};

export function HistoryPanel({ open, bids, now, onClose, onCancelBid }: Props) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Count openings during render (state from the previous render) so the list
  // staggers in on the first open only.
  const [track, setTrack] = useState({ open, opens: open ? 1 : 0 });
  const opens = track.open !== open && open ? track.opens + 1 : track.opens;
  if (track.open !== open) setTrack({ open, opens });
  const staggerIn = opens === 1 && !reduced;

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key === "Tab" && panelRef.current) {
        // Trap focus: cycle through the panel buttons, wrapping at both ends.
        const items = [...panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
        if (items.length === 0) return;
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.shiftKey
          ? i <= 0
            ? items.length - 1
            : i - 1
          : i === items.length - 1
            ? 0
            : i + 1;
        e.preventDefault();
        items[next].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener.current?.focus();
    };
  }, [open]);

  const newestFirst = [...bids].reverse();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? reducedFade : base}
          className="fixed inset-0 z-30 bg-black/60"
          onClick={onClose}
        >
          {/* eslint-disable jsx-a11y/prefer-tag-over-role -- animated side panel; a native <dialog> brings its own positioning and open semantics that fight the overlay */}
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Bid history"
            initial={{ x: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }}
            transition={reduced ? reducedFade : base}
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-sand p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">History</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1 text-sm hover:bg-sand-deep"
              >
                Close
              </button>
            </div>
            {newestFirst.length === 0 && <p className="text-sm text-ink-soft">No bids yet</p>}
            <ul className="space-y-2 overflow-y-auto">
              <AnimatePresence initial={false}>
                {newestFirst.map((b, i) => (
                  <motion.li
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: reduced ? 0 : -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...(reduced ? reducedFade : base),
                      delay: staggerIn ? i * STAGGER_S : 0,
                    }}
                    className={`flex items-center justify-between rounded-md bg-sand-deep px-3 py-2 text-sm ${b.cancelled ? "text-ink-soft" : ""}`}
                  >
                    <span className={b.cancelled ? "line-through" : ""}>
                      {BIDDERS[b.bidder].name} · {formatMoney(b.amount)}
                      <span className="ml-2 text-xs text-ink-soft no-underline">
                        {formatRelative(now - b.at)}
                      </span>
                    </span>
                    {b.cancelled ? (
                      <span className="text-xs">cancelled</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCancelBid(b.id)}
                        className="rounded-md border border-ink-soft/40 px-2 py-1 text-xs hover:bg-sand"
                      >
                        Cancel
                      </button>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.aside>
          {/* eslint-enable jsx-a11y/prefer-tag-over-role */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
