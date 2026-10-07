import Link from "next/link";
import { BIDDER_IDS, BIDDERS } from "@/lib/auction";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Live auction</h1>
        <p className="mt-2 text-ink-soft">
          One home, three bidders and an auctioneer. Open a couple of bidders in their own tabs, or
          on a phone if you have one handy, and every bid rolls across all of them the moment it
          lands. The auctioneer page runs the clock, can cancel a bid, and restarts the sale.
        </p>
      </div>
      <section>
        <h2 className="mb-3 text-xs text-ink-soft">Bid as</h2>
        <div className="grid grid-cols-3 gap-3">
          {BIDDER_IDS.map((id) => (
            <Link
              key={id}
              href={`/bid/${id}`}
              target="_blank"
              rel="noopener"
              className="rounded-md bg-sand py-4 text-center font-medium transition-transform hover:bg-sand-deep active:scale-[0.97] motion-reduce:transition-none"
            >
              {BIDDERS[id].name}
            </Link>
          ))}
        </div>
      </section>
      <Link
        href="/auctioneer"
        target="_blank"
        rel="noopener"
        className="rounded-md bg-ink py-4 text-center font-medium text-paper transition-transform hover:bg-accent hover:text-white active:scale-[0.97] motion-reduce:transition-none"
      >
        Auctioneer
      </Link>
      <a
        href="https://github.com/agustingabiola/auction-takehome"
        target="_blank"
        rel="noopener"
        className="text-center text-sm text-ink-soft underline-offset-4 hover:underline"
      >
        Source on GitHub
      </a>
    </main>
  );
}
