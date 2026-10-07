import { PROPERTY } from "@/lib/auction";

export function PropertyCard() {
  return (
    <section className="flex items-center gap-4">
      <div className="h-20 w-20 shrink-0 rounded-md bg-sand" aria-hidden>
        <svg viewBox="0 0 80 80" className="h-full w-full">
          <path
            d="M14 40 L40 18 L66 40"
            fill="none"
            stroke="#98a2b3"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <rect x="22" y="38" width="36" height="26" rx="2" fill="#344054" />
          <rect x="35" y="48" width="10" height="16" rx="1" fill="#7a5af8" />
          <rect x="26" y="43" width="7" height="7" rx="1" fill="#98a2b3" />
          <rect x="47" y="43" width="7" height="7" rx="1" fill="#98a2b3" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-semibold leading-tight">{PROPERTY.title}</h1>
        <p className="text-sm text-ink-soft">{PROPERTY.subtitle}</p>
      </div>
    </section>
  );
}
