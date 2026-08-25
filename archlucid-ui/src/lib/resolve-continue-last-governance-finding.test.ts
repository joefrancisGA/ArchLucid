import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { resolveContinueLastGovernanceFinding } from "@/lib/resolve-continue-last-governance-finding";

function row(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Review 1",
    manifestId: "manifest-1",
    findingId: "finding-1",
    title: "Private endpoint gap",
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Fix",
    recordKind: "finding",
    agingDays: 2,
    ...overrides,
  };
}

describe("resolveContinueLastGovernanceFinding", () => {
  it("falls back to the oldest open finding when no recent view exists", () => {
    const match = resolveContinueLastGovernanceFinding([
      row({ findingId: "finding-new", title: "Newer", agingDays: 1 }),
      row({ findingId: "finding-old", title: "Oldest", agingDays: 12 }),
    ]);

    expect(match?.findingId).toBe("finding-old");
    expect(match?.href).toBe("/architecture/reviews/run-1/findings/finding-old");
  });
});
