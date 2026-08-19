import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { sortGovernanceAssignedToMeQueueRows } from "@/lib/governance/governance-assigned-to-me-queue-sort";

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

describe("governance-assigned-to-me-queue-sort", () => {
  it("defaults to severity then due date", () => {
    const rows = sortGovernanceAssignedToMeQueueRows([
      baseRow({ findingId: "low-later", severity: "Low", revisitDueUtc: "2026-09-01T00:00:00.000Z" }),
      baseRow({ findingId: "high-soon", severity: "High", revisitDueUtc: "2026-08-01T00:00:00.000Z" }),
      baseRow({ findingId: "high-later", severity: "High", revisitDueUtc: "2026-10-01T00:00:00.000Z" }),
    ]);

    expect(rows.map((row) => row.findingId)).toEqual(["high-soon", "high-later", "low-later"]);
  });
});
