import Link from "next/link";
import { BIDDERS, type BidderId } from "@/lib/auction";
import { formatMoney } from "@/lib/format";

type Props = {
  leader: BidderId | null;
  amount: number;
  me: BidderId | null;
  showAuctioneerLink?: boolean;
};

export function EndedBanner({ leader, amount, me, showAuctioneerLink = true }: Props) {
  const text =
    leader === null
      ? "No sale"
      : leader === me
        ? `You won it for ${formatMoney(amount)}`
        : `Sold to ${BIDDERS[leader].name} for ${formatMoney(amount)}`;
  return (
    <div className="rounded-md bg-sand p-4 text-center">
      <p className="text-lg font-semibold">{text}</p>
      {showAuctioneerLink && (
        <Link href="/auctioneer" className="text-sm text-ink-soft underline">
          Open the auctioneer to restart
        </Link>
      )}
    </div>
  );
}
