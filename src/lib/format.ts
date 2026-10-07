export function formatMoney(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export function clockSeconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

export function secondsToClock(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatClock(ms: number): string {
  return secondsToClock(clockSeconds(ms));
}

export function formatRelative(deltaMs: number): string {
  const s = Math.floor(deltaMs / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}
