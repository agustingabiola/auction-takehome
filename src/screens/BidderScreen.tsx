"use client";
import Link from "next/link";
import { useCallback } from "react";
import { BIDDERS, type BidderId } from "@/lib/auction";
import { formatMoney } from "@/lib/format";
import { useAuction } from "@/lib/client/useAuction";
import { BidControls } from "@/components/BidControls";
import { BidHistory } from "@/components/BidHistory";
import { ConnectionDot } from "@/components/ConnectionDot";
import { Countdown } from "@/components/Countdown";
import { EndedBanner } from "@/components/EndedBanner";
import { PropertyCard } from "@/components/PropertyCard";
import { RollingNumber } from "@/components/RollingNumber";
import { priceSizeClass } from "@/components/priceSize";
import { StatusChip, type ChipKind } from "@/components/StatusChip";
import { Toasts } from "@/components/Toasts";

export function BidderScreen({ bidder }: { bidder: BidderId }) {
  const { snapshot, derived, now, connection, alerts, dismissAlert, pushNotice, dispatch } =
    useAuction(bidder);

  const onBid = useCallback(
    async (amount: number) => {
      const result = await dispatch({ type: "BID_PLACED", bidder, amount });
      if (!result.ok) pushNotice(result.reason);
      return result;
    },
    [bidder, dispatch, pushNotice],
  );

  const hasActiveBid = derived?.activeBids.some((b) => b.bidder === bidder) ?? false;
  const chip: ChipKind = !derived
    ? "watching"
    : derived.status === "ended"
      ? derived.leader === bidder
        ? "won"
        : hasActiveBid
          ? "lost"
          : "ended"
      : derived.leader === bidder
        ? "leading"
        : hasActiveBid
          ? "outbid"
          : "watching";

  // The chip already says "You're leading", so the line only names someone else
  // or the empty state; its height is reserved so the row never shifts.
  const leaderLine = !derived
    ? ""
    : derived.leader === null
      ? "No bids yet"
      : derived.leader === bidder
        ? ""
        : `${BIDDERS[derived.leader].name} is leading`;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between text-sm text-ink-soft">
        <span>
          Bidding as <strong className="text-ink">{BIDDERS[bidder].name}</strong>
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
          <p className="mt-2 min-h-5 text-sm text-ink-soft" aria-live="polite">
            {leaderLine}
          </p>
        </div>
        {snapshot && derived ? (
          <Countdown remainingMs={derived.remainingMs} />
        ) : (
          <span className="inline-block h-10 w-20 animate-pulse rounded bg-sand" />
        )}
      </section>
      <div>
        <StatusChip kind={chip} />
      </div>
      {derived && derived.status === "ended" && (
        <EndedBanner leader={derived.leader} amount={derived.currentPrice} me={bidder} />
      )}
      {derived && (
        <BidControls
          minimumBid={derived.minimumBid}
          currentPrice={derived.currentPrice}
          isLeader={derived.leader === bidder}
          ended={derived.status === "ended"}
          onBid={onBid}
        />
      )}
      {snapshot && <BidHistory bids={snapshot.auction.bids} now={now} me={bidder} />}
      <Link
        href="/"
        className="mt-8 self-center text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        Back to home
      </Link>
      <Toasts items={alerts} onDismiss={dismissAlert} />
    </main>
  );
}
