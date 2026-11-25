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
  it("sorts by the displayed exception expiry when the revisit date is blank", () => {
    const rows = sortGovernanceAssignedToMeQueueRows([
      baseRow({ findingId: "later", revisitDueUtc: "2026-09-02T00:00:00Z" }),
      baseRow({ findingId: "sooner", revisitDueUtc: " ", waiverExpiresAtUtc: "2026-09-01T00:00:00Z" }),
    ], "due");

    expect(rows.map((row) => row.findingId)).toEqual(["sooner", "later"]);
  });

  it("defaults to severity then due date", () => {
    const rows = sortGovernanceAssignedToMeQueueRows([
      baseRow({ findingId: "low-later", severity: "Low", revisitDueUtc: "2026-09-01T00:00:00.000Z" }),
      baseRow({ findingId: "high-soon", severity: "High", revisitDueUtc: "2026-08-01T00:00:00.000Z" }),
      baseRow({ findingId: "high-later", severity: "High", revisitDueUtc: "2026-10-01T00:00:00.000Z" }),
    ]);

    expect(rows.map((row) => row.findingId)).toEqual(["high-soon", "high-later", "low-later"]);
  });
  it("ranks lowercase API severities ahead of higher title-case lows", () => {
    const rows = sortGovernanceAssignedToMeQueueRows([
      baseRow({ findingId: "title-low", severity: "Low" }),
      baseRow({ findingId: "lower-critical", severity: "critical" }),
    ]);

    expect(rows.map((row) => row.findingId)).toEqual(["lower-critical", "title-low"]);
  });

  it("ranks contract Error severity ahead of Medium", () => {
    const rows = sortGovernanceAssignedToMeQueueRows([
      baseRow({ findingId: "medium", severity: "Medium" }),
      baseRow({ findingId: "error", severity: "Error" }),
    ]);

    expect(rows.map((row) => row.findingId)).toEqual(["error", "medium"]);
  });
  it("ranks informational severity after Low", () => {
    const rows = sortGovernanceAssignedToMeQueueRows([
      baseRow({ findingId: "info", severity: "Informational" }),
      baseRow({ findingId: "low", severity: "Low" }),
    ]);

    expect(rows.map((row) => row.findingId)).toEqual(["low", "info"]);
  });

  it("ranks contract Warning severity ahead of Info", () => {
    const rows = sortGovernanceAssignedToMeQueueRows([
      baseRow({ findingId: "info", severity: "Info" }),
      baseRow({ findingId: "warning", severity: "Warning" }),
    ]);

    expect(rows.map((row) => row.findingId)).toEqual(["warning", "info"]);
  });
});
