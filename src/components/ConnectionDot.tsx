import type { Connection } from "@/lib/client/useAuction";

const LABEL: Record<Connection, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  paused: "Paused",
};

const DOT: Record<Connection, string> = {
  connecting: "bg-sand-deep",
  live: "bg-accent",
  reconnecting: "bg-warn",
  paused: "bg-sand-deep",
};

export function ConnectionDot({ connection }: { connection: Connection }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-soft" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${DOT[connection]}`} aria-hidden />
      {LABEL[connection]}
    </span>
  );
}
