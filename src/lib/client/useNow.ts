"use client";
import { useEffect, useState, type RefObject } from "react";

export const CLOCK_TICK_MS = 200;

/** Current time on the server's clock, re-rendered every CLOCK_TICK_MS. */
export function useNow(offsetRef: RefObject<number>): number {
  // Starts at 0 and is set in the effect: Next 16 prerendering rejects Date.now()
  // during render, and nothing time-dependent renders before the first snapshot,
  // which arrives after this effect has run.
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now() + (offsetRef.current ?? 0));
    const id = setInterval(() => setNow(Date.now() + (offsetRef.current ?? 0)), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [offsetRef]);
  return now;
}
