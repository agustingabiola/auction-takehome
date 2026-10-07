import { notFound } from "next/navigation";
import { BIDDER_IDS, isBidderId } from "@/lib/auction";
import { BidderScreen } from "@/screens/BidderScreen";

// The three bidder pages are prerendered with their real segment, so the
// static shell is never the not-found page. Any other segment renders on
// demand and gets a genuine 404.
// Unknown segments render on demand; `instant = false` is the documented way to
// read params outside Suspense for that path without a blocking-navigation warning.
export const instant = false;

export function generateStaticParams() {
  return BIDDER_IDS.map((bidder) => ({ bidder }));
}

export default async function BidPage({ params }: { params: Promise<{ bidder: string }> }) {
  const { bidder } = await params;
  if (!isBidderId(bidder)) notFound();
  return <BidderScreen bidder={bidder} />;
}
