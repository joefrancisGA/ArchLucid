import { describe, expect, it } from "vitest";

import { deriveRunsDashboardTabCounts } from "@/lib/operator/run-home-status";

describe("deriveRunsDashboardTabCounts", () => {
  it("normalizes non-finite awaiting-approval tab counts to zero", () => {
    const counts = deriveRunsDashboardTabCounts([], Number.NaN);

    expect(counts["awaiting-approval"]).toBe(0);
  });
});
