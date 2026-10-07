"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { BIDDERS } from "@/lib/auction";
import { formatMoney } from "@/lib/format";
import type { QueuedAlert } from "@/lib/client/useAuction";
import { base, reducedFade } from "./motion";

const TOAST_MS = 4_000;

export function toastText(item: QueuedAlert["alert"]): string {
  switch (item.kind) {
    case "outbid":
      return `Outbid by ${BIDDERS[item.by].name} at ${formatMoney(item.amount)}`;
    case "cancelled":
      return `Your ${formatMoney(item.amount)} bid was cancelled by the auctioneer`;
    case "leading-again":
      return item.by
        ? `${BIDDERS[item.by].name}'s bid was cancelled, you're leading again`
        : "You're leading again";
    case "restarted":
      return "Auction restarted";
    case "notice":
      return item.text;
  }
}

function Toast({ item, onDismiss }: { item: QueuedAlert; onDismiss: (id: number) => void }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), TOAST_MS);
    return () => clearTimeout(t);
  }, [item.id, onDismiss]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : 8 }}
      transition={reduced ? reducedFade : base}
      className="rounded-md bg-ink px-4 py-2 text-sm text-paper shadow-lg"
    >
      {toastText(item.alert)}
    </motion.div>
  );
}

export function Toasts({
  items,
  onDismiss,
}: {
  items: QueuedAlert[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 flex flex-col-reverse items-center gap-2 px-4"
      aria-live="polite"
    >
      <AnimatePresence>
        {items.map((item) => (
          <Toast key={item.id} item={item} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
