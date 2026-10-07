export function computeOffset(serverNow: number, clientNow: number): number {
  return serverNow - clientNow;
}
