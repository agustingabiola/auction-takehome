"use client";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import { formatMoney } from "@/lib/format";
import type { DispatchResult } from "@/lib/client/useAuction";
import {
  afterAcceptedBid,
  initialBidInput,
  isValidBid,
  onMinimumChange,
  onUserEdit,
  parseAmount,
} from "@/lib/client/bidInput";
import { ConfirmDialog } from "./ConfirmDialog";
import { RollingNumber } from "./RollingNumber";
import { fast } from "./motion";

// Mocked placement latency for the demo: the button stays in its pending state
// for at least this long before the bid is sent, so the moment reads as a real
// submission rather than an instant flip.
const MOCK_PLACEMENT_MS = 4_000;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Props = {
  minimumBid: number;
  currentPrice: number;
  isLeader: boolean;
  ended: boolean;
  onBid: (amount: number) => Promise<DispatchResult>;
};

export function BidControls({ minimumBid, currentPrice, isLeader, ended, onBid }: Props) {
  const reduced = useReducedMotion();
  // The field tracks the minimum while untouched. A change in the minimum is
  // applied during render from the last seen value (state from the previous
  // render), so no effect is needed.
  const [field, setField] = useState(() => ({
    seenMin: minimumBid,
    input: initialBidInput(minimumBid),
  }));
  const input =
    field.seenMin === minimumBid ? field.input : onMinimumChange(field.input, minimumBid);
  if (field.seenMin !== minimumBid) setField({ seenMin: minimumBid, input });
  const setInput = (next: typeof input) => setField({ seenMin: minimumBid, input: next });

  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const cancelConfirm = useCallback(() => setConfirming(false), []);

  const valid = isValidBid(input.value, minimumBid);
  const amount = parseAmount(input.value);
  const disabled = ended || pending || !valid;

  const place = async () => {
    if (amount === null) return;
    setPending(true);
    await sleep(MOCK_PLACEMENT_MS);
    const result = await onBid(amount);
    setPending(false);
    if (result.ok) setInput(afterAcceptedBid(minimumBid));
  };

  const submit = () => {
    if (disabled) return;
    if (isLeader) setConfirming(true);
    else void place();
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className={`text-sm ${valid ? "text-ink-soft" : "text-warn"}`} aria-live="polite">
        Minimum bid{" "}
        <RollingNumber value={minimumBid} format={formatMoney} className="font-medium" />
      </p>
      <label className="flex items-center gap-2 rounded-md border border-sand-deep bg-sand px-3 py-2 focus-within:border-ink">
        <span className="text-ink-soft">$</span>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={input.value}
          onChange={(e) => setInput(onUserEdit(input, e.target.value))}
          disabled={ended}
          aria-label="Your bid in dollars"
          className="w-full bg-transparent text-2xl tabular-nums outline-none"
        />
      </label>
      <motion.button
        type="submit"
        disabled={disabled}
        whileTap={reduced || disabled ? undefined : { scale: 0.97 }}
        transition={fast}
        className="w-full rounded-md bg-accent py-3 text-base font-medium text-white disabled:bg-sand-deep disabled:text-ink-soft"
      >
        {ended ? "Auction ended" : pending ? "Placing…" : "Place bid"}
      </motion.button>
      <ConfirmDialog
        open={confirming}
        title="Raise your own bid?"
        body={`You're already the highest bidder at ${formatMoney(currentPrice)}. Raise your own bid to ${amount === null ? "" : formatMoney(amount)}?`}
        confirmLabel="Raise bid"
        cancelLabel="Keep current bid"
        onConfirm={() => {
          setConfirming(false);
          void place();
        }}
        onCancel={cancelConfirm}
      />
    </form>
  );
}
