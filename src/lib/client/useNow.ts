"use client";
import { useEffect, useState, type RefObject } from "react";

export const CLOCK_TICK_MS = 200;

/** Current time on the server's clock, re-rendered every CLOCK_TICK_MS. */
export function useNow(offsetRef: RefObject<number>): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now() + (offsetRef.current ?? 0));
    const id = setInterval(() => setNow(Date.now() + (offsetRef.current ?? 0)), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [offsetRef]);
  return now;
}
