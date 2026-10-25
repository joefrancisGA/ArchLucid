import { describe, expect, it } from "vitest";

import {
  deriveRunsDashboardTabCounts,
  normalizeOperatorShellNullableCount,
} from "@/lib/operator/run-home-status";

describe("normalizeOperatorShellNullableCount", () => {
  it("maps non-finite counts to null", () => {
    expect(normalizeOperatorShellNullableCount(Number.NaN)).toBeNull();
    expect(normalizeOperatorShellNullableCount(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("truncates finite non-negative counts", () => {
    expect(normalizeOperatorShellNullableCount(4.9)).toBe(4);
    expect(normalizeOperatorShellNullableCount(undefined)).toBeNull();
    expect(normalizeOperatorShellNullableCount(null)).toBeNull();
  });
});

describe("deriveRunsDashboardTabCounts", () => {
  it("normalizes non-finite awaiting-approval tab counts to zero", () => {
    const counts = deriveRunsDashboardTabCounts([], Number.NaN);

    expect(counts["awaiting-approval"]).toBe(0);
  });
});
