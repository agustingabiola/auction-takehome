"use client";
import { motion, useReducedMotion } from "motion/react";
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
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs text-ink-soft">{ended ? "Ended" : "Time left"}</span>
      <motion.span
        key={pulse ? secs : "steady"}
        animate={pulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="inline-block"
      >
        <motion.span
          animate={{ color: warn ? "#b4541a" : "#17171a" }}
          transition={base}
          className="inline-block"
        >
          <RollingNumber value={secs} format={secondsToClock} className="text-4xl font-semibold" />
        </motion.span>
      </motion.span>
    </div>
  );
}
