"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { base, reducedFade, roll, STAGGER_S } from "./motion";

type Props = {
  value: number;
  format: (n: number) => string;
  className?: string;
};

type Dir = 1 | -1;

/**
 * Increasing values move upward: the old digit exits through the top and the
 * new one enters from the bottom. Decreasing values do the reverse. The exit
 * reads the direction through AnimatePresence custom prop so a digit
 * leaving right after a direction flip still moves the right way.
 */
const rollVariants = {
  enter: (d: Dir) => ({ y: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: Dir) => ({ y: d > 0 ? "-100%" : "100%", opacity: 0 }),
};
// Same keys as rollVariants (y stays 0) so server and client inline styles match.
const fadeVariants = {
  enter: { y: 0, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: 0, opacity: 0 },
};

type Cell = { ch: string; key: string; isDigit: boolean; staggerIndex: number };

/**
 * Splits the digits of a formatted number into cells keyed by their position
 * from the right, so gaining a digit ("$950" to "$1,000") adds cells on the
 * left while the existing digits keep rolling in place. staggerIndex counts
 * the digits to the right of a cell: changing digits start from the rightmost
 * and stagger leftward.
 */
function toCells(body: string): Cell[] {
  const cells: Cell[] = [];
  let digitsToTheRight = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    const ch = body[i];
    const isDigit = /\d/.test(ch);
    cells.unshift({ ch, key: `r${body.length - 1 - i}`, isDigit, staggerIndex: digitsToTheRight });
    if (isDigit) digitsToTheRight += 1;
  }
  return cells;
}

/**
 * Renders a formatted number as one cell per character. Digit cells roll
 * vertically when their digit changes: upward when the value increased,
 * downward when it decreased. A leading non-digit prefix (the "$") is a
 * fixed cell outside that scheme.
 */
export function RollingNumber({ value, format, className }: Props) {
  const reduced = useReducedMotion();
  // Direction of the last change, derived during render from the previous
  // value (React's documented pattern for state that depends on prior props).
  const [tracked, setTracked] = useState({ value, dir: 1 as Dir });
  if (tracked.value !== value) {
    setTracked({ value, dir: value > tracked.value ? 1 : -1 });
  }
  const dir: Dir = tracked.value === value ? tracked.dir : value > tracked.value ? 1 : -1;

  const text = format(value);
  const prefixMatch = text.match(/^\D*/);
  const prefix = prefixMatch ? prefixMatch[0] : "";
  const cells = toCells(text.slice(prefix.length));

  const transition = reduced ? reducedFade : roll;

  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap tabular-nums ${className ?? ""}`}
    >
      <span className="sr-only">{text}</span>
      {prefix && <span aria-hidden>{prefix}</span>}
      {cells.map((cell) => (
        <motion.span
          key={cell.key}
          layout
          transition={base}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-hidden
          className={`relative inline-block overflow-hidden ${cell.isDigit ? "w-[1ch] text-center" : ""}`}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.span
              key={cell.ch}
              custom={dir}
              variants={reduced ? fadeVariants : rollVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ ...transition, delay: reduced ? 0 : cell.staggerIndex * STAGGER_S }}
              className="inline-block"
            >
              {cell.ch}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      ))}
    </span>
  );
}
