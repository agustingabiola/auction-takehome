"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { base, reducedFade, SHAKE_X, shakeTransition } from "./motion";

export type ChipKind = "watching" | "leading" | "outbid" | "won" | "lost" | "ended";

const LABEL: Record<ChipKind, string> = {
  watching: "Watching",
  leading: "You're leading",
  outbid: "Outbid",
  won: "You won",
  lost: "Lost",
  ended: "Ended",
};

const TONE: Record<ChipKind, string> = {
  watching: "bg-sand text-ink",
  leading: "bg-oxblood text-paper",
  outbid: "bg-warn text-paper",
  won: "bg-oxblood text-paper",
  lost: "bg-sand-deep text-ink",
  ended: "bg-sand-deep text-ink",
};

export function StatusChip({ kind }: { kind: ChipKind }) {
  const reduced = useReducedMotion();
  // Count arrivals at "outbid" during render (state from the previous render)
  // so the shake re-triggers on every re-entry without an effect.
  const [tracked, setTracked] = useState({ kind, shakes: 0 });
  const shakes = tracked.kind !== kind && kind === "outbid" ? tracked.shakes + 1 : tracked.shakes;
  if (tracked.kind !== kind) setTracked({ kind, shakes });
  return (
    <motion.span
      key={shakes}
      animate={kind === "outbid" && !reduced && shakes > 0 ? { x: SHAKE_X } : { x: 0 }}
      transition={shakeTransition}
      className="inline-block"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={kind}
          initial={{ opacity: 0, y: reduced ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -4 }}
          transition={reduced ? reducedFade : base}
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${TONE[kind]}`}
        >
          {LABEL[kind]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
