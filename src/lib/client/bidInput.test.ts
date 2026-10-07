import { describe, it, expect } from "vitest";
import {
  initialBidInput,
  onMinimumChange,
  onUserEdit,
  afterAcceptedBid,
  parseAmount,
  isValidBid,
} from "./bidInput";

describe("bid input", () => {
  it("starts untouched at the minimum", () => {
    expect(initialBidInput(1250)).toEqual({ value: "1250", touched: false });
  });

  it("an untouched field follows the minimum", () => {
    expect(onMinimumChange(initialBidInput(1250), 1300)).toEqual({ value: "1300", touched: false });
  });

  it("an edited field keeps its value even when the minimum rises past it", () => {
    const edited = onUserEdit(initialBidInput(1250), "1275");
    expect(edited).toEqual({ value: "1275", touched: true });
    expect(onMinimumChange(edited, 1400)).toEqual({ value: "1275", touched: true });
  });

  it("strips non-digits while editing", () => {
    expect(onUserEdit(initialBidInput(1250), "$1,3a00").value).toBe("1300");
    expect(onUserEdit(initialBidInput(1250), "").value).toBe("");
  });

  it("resets to tracking after an accepted bid", () => {
    expect(afterAcceptedBid(1350)).toEqual({ value: "1350", touched: false });
  });

  it("parses and validates against the minimum", () => {
    expect(parseAmount("1300")).toBe(1300);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("12.5")).toBeNull();
    expect(isValidBid("1300", 1300)).toBe(true);
    expect(isValidBid("1299", 1300)).toBe(false);
    expect(isValidBid("", 1300)).toBe(false);
  });
});
