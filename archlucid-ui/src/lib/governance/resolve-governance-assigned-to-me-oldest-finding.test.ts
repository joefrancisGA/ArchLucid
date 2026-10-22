import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { resolveGovernanceAssignedToMeOldestFinding } from "@/lib/governance/resolve-governance-assigned-to-me-oldest-finding";

const baseRow = (overrides: Partial<GovernanceFindingQueueRow>): GovernanceFindingQueueRow => ({
  runId: "run-1",
  runLabel: "Review A",
  manifestId: "manifest-1",
  findingId: "finding-1",
  title: "Alpha",
  severity: "Medium",
  category: "Security",
  status: "Open",
  recordKind: "finding",
  recommended: "Fix",
  policyRuleId: null,
  ownerUserId: "owner@contoso.com",
  waiverExpiresAtUtc: null,
  lastReviewedUtc: null,
  revisitDueUtc: null,
  agingDays: 1,
  isStale: false,
  ...overrides,
});

describe("resolveGovernanceAssignedToMeOldestFinding", () => {
  it("returns the finding with the highest aging days", () => {
    const target = resolveGovernanceAssignedToMeOldestFinding([
      baseRow({ findingId: "newer", agingDays: 2 }),
      baseRow({ findingId: "oldest", agingDays: 14, title: "Stale boundary gap" }),
      baseRow({ findingId: "middle", agingDays: 7 }),
    ]);

    expect(target).toEqual({
      findingId: "oldest",
      findingTitle: "Stale boundary gap",
      runId: "run-1",
      agingDays: 14,
    });
  });

  it("ignores architecture decision rows", () => {
    const target = resolveGovernanceAssignedToMeOldestFinding([
      baseRow({ findingId: "decision-1", recordKind: "decision", agingDays: 99 }),
      baseRow({ findingId: "finding-1", agingDays: 3 }),
    ]);

    expect(target?.findingId).toBe("finding-1");
  });
});
