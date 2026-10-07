# Auction bidding demo

Deployed at: https://auction-takehome.vercel.app

A single property, several bidders each in their own tab or on their own device, and an auctioneer who runs the sale. Built for a take-home whose brief asked for a bidding interaction with particular attention to motion design and number transitions, timeboxed at 30 to 60 minutes and deployed.

## Sixty-second demo

1. Open the URL and press **Auctioneer**.
2. Open the URL in two more tabs, or on a phone, and pick **Gaspar** in one and **Agustin** in the other.
3. Watch the price roll on every screen, the other bidder get an _Outbid_ alert, and the history fill in.
4. From the auctioneer, open **History** and cancel the top bid: the price rolls back down and the leader changes.
5. Use **−30 s** / **+30 s** and **Reset auction**.

## How it works

- **One snapshot, one key.** The whole auction is a JSON document in Upstash Redis. Reads are one command; writes go through a compare-and-swap Lua script so two bids in the same instant cannot both win.
- **The server is the only writer.** Every change is an event (`BID_PLACED`, `BID_CANCELLED`, `TIMER_ADJUSTED`, `RESET`) validated by one pure reducer in `src/lib/auction.ts`, shared by the route handlers and the tests.
- **Clients hold no truth.** They render the latest snapshot and derive price, leader, status, countdown and alerts from it. The server's clock rides along in every snapshot so devices with skewed clocks agree on the countdown.
- **Transport.** A Server-Sent Events stream while the auction is live and the tab is visible (`/api/auction/stream`, closed cleanly before Vercel's 5-minute function cap; the browser reconnects), a slow poll once the auction has ended, and nothing at all while the tab is hidden.

## Trade-offs taken on purpose

- **Shared pure reducer.** Every rule lives in one function: current auction plus one event in, new auction or a reason out. The server runs it to decide, the client imports the same file to derive what to show, the tests feed it plain data. One place to read the rules.
- **Compare-and-swap over last-write-wins.** Two bids in the same instant each read, reduce and try to write. The Lua script saves only if the document is still what that request read; the loser re-reads and gets the correct "minimum bid is now X" rejection. Without it a simultaneous bid would silently erase another.
- **History inside the one document.** The `bids` array is the only record. Price and leader are computed from it. Every snapshot carries the full history, a few kilobytes for a demo.

## Animated numbers: Motion

- `RollingNumber` renders one cell per character. Only digits that change move; they roll upward on increases and downward on decreases, staggered from the right. Tabular figures keep widths stable, and gaining a digit (`$950` to `$1,000`) adds cells on the left instead of reflowing the number.
- One bid is a short sequence: button press, price roll, legend roll, leader line, history entry, status chip. Few beats, deliberately timed.
- `prefers-reduced-motion` turns every roll into a crossfade and disables the shake and the pulse.

## Known omissions

- No authentication on auctioneer actions nor bidders
- One shared auction for every visitor; no rooms.
- State expires an hour after the last write.

## Running locally

```bash
npm install
vercel link && vercel env pull .env.local
echo 'AUCTION_KEY=auction:dev' >> .env.local
npm run dev
npm test
npm run lint      # oxlint
npm run format    # oxfmt
```

Without `.env.local` the dev server falls back to an in-memory store, which is also what the tests use.
