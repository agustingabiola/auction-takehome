"use client";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { RollingNumber } from "./RollingNumber";
import { clockSeconds, secondsToClock } from "@/lib/format";
import { base } from "./motion";

const WARN_S = 30;
const PULSE_S = 10;

export function Countdown({ remainingMs }: { remainingMs: number }) {
  const reduced = useReducedMotion();
  const secs = clockSeconds(remainingMs);
  const ended = secs === 0;
  const warn = secs <= WARN_S && !ended;
  const pulse = secs <= PULSE_S && !ended && !reduced;

  // The pulse is driven imperatively on a stable element so RollingNumber stays
  // mounted and keeps rolling through the final seconds.
  const [scope, animate] = useAnimate();
  useEffect(() => {
    if (!pulse) return;
    animate(scope.current, { scale: [1, 1.04, 1] }, { duration: 0.4, ease: "easeOut" });
  }, [secs, pulse, animate, scope]);

  return (
    <div className="flex flex-col items-end">
      <span className="text-xs text-ink-soft">{ended ? "Ended" : "Time left"}</span>
      <span ref={scope} className="inline-block">
        <motion.span
          animate={{ color: warn ? "#f79009" : "#ffffff" }}
          transition={base}
          className="inline-block"
        >
          <RollingNumber
            value={secs}
            format={secondsToClock}
            className="text-4xl font-semibold leading-none"
          />
        </motion.span>
      </span>
    </div>
  );
}
