"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BIDDERS, TIMER_STEP_MS } from "@/lib/auction";
import { formatMoney } from "@/lib/format";
import { useAuction } from "@/lib/client/useAuction";
import { ConnectionDot } from "@/components/ConnectionDot";
import { Countdown } from "@/components/Countdown";
import { EndedBanner } from "@/components/EndedBanner";
import { HistoryPanel } from "@/components/HistoryPanel";
import { PropertyCard } from "@/components/PropertyCard";
import { RollingNumber } from "@/components/RollingNumber";
import { priceSizeClass } from "@/components/priceSize";
import { Toasts } from "@/components/Toasts";

const CONFIRM_WINDOW_MS = 3_000;

export function AuctioneerScreen() {
  const { snapshot, derived, now, connection, alerts, dismissAlert, pushNotice, dispatch } =
    useAuction(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  useEffect(() => {
    if (!confirmingReset) return;
    const t = setTimeout(() => setConfirmingReset(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(t);
  }, [confirmingReset]);

  const send = useCallback(
    async (event: Parameters<typeof dispatch>[0]) => {
      const r = await dispatch(event);
      if (!r.ok) pushNotice(r.reason);
    },
    [dispatch, pushNotice],
  );

  const onReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setConfirmingReset(false);
    void send({ type: "RESET" });
  };

  const leaderLine = !derived
    ? ""
    : derived.leader === null
      ? "No bids yet"
      : `${BIDDERS[derived.leader].name} is leading`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between text-sm text-ink-soft">
        <span>
          <strong className="text-ink">Auctioneer</strong>
        </span>
        {derived?.status !== "ended" && <ConnectionDot connection={connection} />}
      </header>
      <PropertyCard />
      <section className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <span className="text-xs text-ink-soft">
            {derived?.topBid ? "Current bid" : "Starting at"}
          </span>
          <div
            className={`${derived ? priceSizeClass(derived.currentPrice) : "text-6xl"} font-semibold leading-none text-accent`}
          >
            {derived ? (
              <RollingNumber value={derived.currentPrice} format={formatMoney} />
            ) : (
              <span className="inline-block h-14 w-48 animate-pulse rounded bg-sand" />
            )}
          </div>
          <p className="mt-2 text-sm text-ink-soft" aria-live="polite">
            {leaderLine}
          </p>
        </div>
        {derived ? (
          <Countdown remainingMs={derived.remainingMs} />
        ) : (
          <span className="inline-block h-10 w-20 animate-pulse rounded bg-sand" />
        )}
      </section>
      {derived && derived.status === "ended" && (
        <EndedBanner
          leader={derived.leader}
          amount={derived.currentPrice}
          me={null}
          showAuctioneerLink={false}
        />
      )}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => void send({ type: "TIMER_ADJUSTED", deltaMs: -TIMER_STEP_MS })}
          className="rounded-md border border-sand-deep py-3 text-sm hover:bg-sand"
        >
          −30 s
        </button>
        <button
          type="button"
          onClick={() => void send({ type: "TIMER_ADJUSTED", deltaMs: TIMER_STEP_MS })}
          className="rounded-md border border-sand-deep py-3 text-sm hover:bg-sand"
        >
          +30 s
        </button>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="rounded-md border border-sand-deep py-3 text-sm hover:bg-sand"
        >
          History
        </button>
        <button
          type="button"
          onClick={onReset}
          className={`rounded-md py-3 text-sm font-medium ${confirmingReset ? "bg-warn text-white" : "bg-ink text-paper"}`}
        >
          {confirmingReset ? "Confirm reset" : "Reset auction"}
        </button>
      </section>
      <Link
        href="/"
        className="mt-8 self-center text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        Back to home
      </Link>
      <HistoryPanel
        open={panelOpen}
        bids={snapshot?.auction.bids ?? []}
        now={now}
        onClose={closePanel}
        onCancelBid={(bidId) => void send({ type: "BID_CANCELLED", bidId })}
      />
      <Toasts items={alerts} onDismiss={dismissAlert} />
    </main>
  );
}
