export type BidInputState = { value: string; touched: boolean };

export function initialBidInput(minimum: number): BidInputState {
  return { value: String(minimum), touched: false };
}

export function onMinimumChange(state: BidInputState, minimum: number): BidInputState {
  return state.touched ? state : initialBidInput(minimum);
}

export function onUserEdit(_state: BidInputState, raw: string): BidInputState {
  return { value: raw.replace(/\D/g, ""), touched: true };
}

export function afterAcceptedBid(minimum: number): BidInputState {
  return initialBidInput(minimum);
}

export function parseAmount(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

export function isValidBid(value: string, minimum: number): boolean {
  const n = parseAmount(value);
  return n !== null && n >= minimum;
}
