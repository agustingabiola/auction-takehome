import { LOT } from "@/lib/auction";

export function LotCard() {
  return (
    <section className="flex items-center gap-4">
      <div className="h-20 w-20 shrink-0 rounded-md bg-sand" aria-hidden>
        <svg viewBox="0 0 80 80" className="h-full w-full">
          <rect x="12" y="30" width="56" height="8" rx="2" fill="#8b6b4a" />
          <rect x="16" y="38" width="6" height="26" fill="#8b6b4a" />
          <rect x="58" y="38" width="6" height="26" fill="#8b6b4a" />
          <rect x="44" y="38" width="20" height="12" fill="#a8866a" />
          <rect x="30" y="22" width="20" height="6" rx="1" fill="#2f2a26" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-semibold leading-tight">{LOT.title}</h1>
        <p className="text-sm text-ink-soft">{LOT.subtitle}</p>
      </div>
    </section>
  );
}
