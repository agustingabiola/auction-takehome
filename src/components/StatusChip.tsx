"use client";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
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
  leading: "bg-accent text-white",
  outbid: "bg-warn text-white",
  won: "bg-accent text-white",
  lost: "bg-sand-deep text-ink",
  ended: "bg-sand-deep text-ink",
};

export function StatusChip({ kind }: { kind: ChipKind }) {
  const reduced = useReducedMotion();
  // Count arrivals at "outbid" during render (state from the previous render).
  // Mounting already outbid counts as zero, so a reload never shakes.
  const [tracked, setTracked] = useState({ kind, shakes: 0 });
  const shakes = tracked.kind !== kind && kind === "outbid" ? tracked.shakes + 1 : tracked.shakes;
  if (tracked.kind !== kind) setTracked({ kind, shakes });

  // The shake runs imperatively on a stable wrapper so the label crossfade
  // below is never interrupted by a remount.
  const [scope, animate] = useAnimate();
  useEffect(() => {
    if (shakes === 0 || reduced) return;
    animate(scope.current, { x: SHAKE_X }, shakeTransition);
  }, [shakes, reduced, animate, scope]);

  return (
    <span ref={scope} className="inline-block">
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
    </span>
  );
}
