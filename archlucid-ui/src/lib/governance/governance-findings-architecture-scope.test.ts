import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  buildGovernanceFindingsArchitectureRunIdSet,
  deriveGovernanceFindingsArchitectureScopeHonesty,
  governanceFindingsArchitectureScopeHrefFromSearch,
  matchesGovernanceFindingsArchitectureScope,
  resolveGovernanceFindingsArchitectureScopeFromUrl,
  scopedArchitectureIdFromQuery,
} from "@/lib/governance/governance-findings-architecture-scope";

const architectureId = "architecture-identity-001";

function row(runId: string): GovernanceFindingQueueRow {
  return {
    runId,
    runLabel: runId,
    manifestId: "manifest-1",
    findingId: `finding-${runId}`,
    title: "Sample finding",
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Fix",
    recordKind: "finding",
  };
}

describe("governance-findings-architecture-scope (AO-28)", () => {
  it("AO-28: default query includes architecture id when last-open set", () => {
    const resolved = resolveGovernanceFindingsArchitectureScopeFromUrl(null, architectureId);

    expect(resolved.architectureId).toBe(architectureId);
    expect(resolved.explicit).toBe(false);
    expect(
      governanceFindingsArchitectureScopeHrefFromSearch("", architectureId, "/governance/findings"),
    ).toBe("/governance/findings?architectureId=architecture-identity-001");
  });

  it("treats architectureId=all as explicit all-architectures scope", () => {
    expect(scopedArchitectureIdFromQuery("all")).toBeNull();
    expect(
      resolveGovernanceFindingsArchitectureScopeFromUrl("all", architectureId),
    ).toEqual({ architectureId: null, explicit: true });
  });

  it("filters rows to architecture-linked review run ids", () => {
    const runIds = buildGovernanceFindingsArchitectureRunIdSet({
      architectureId,
      architectureReviews: [{ runId: "run-a", createdUtc: "2026-01-01T00:00:00Z" }],
      draftRegistryEntries: [
        {
          draftId: "draft-1",
          displayName: "Draft",
          customerStatus: "Drafting",
          ownerLabel: "You",
          lastUpdatedUtc: "2026-01-01T00:00:00Z",
          linkedReviewId: "run-b",
          serverUpdatedUtc: "2026-01-01T00:00:00Z",
          parentArchitectureId: architectureId,
        },
      ],
    });

    expect(matchesGovernanceFindingsArchitectureScope(row("run-a"), runIds)).toBe(true);
    expect(matchesGovernanceFindingsArchitectureScope(row("run-b"), runIds)).toBe(true);
    expect(matchesGovernanceFindingsArchitectureScope(row("run-other"), runIds)).toBe(false);
  });

  it("reports hidden other-architecture findings with CA-40-style honesty", () => {
    const allRows = [row("run-a"), row("run-other")];
    const architectureScopedRows = [row("run-a")];

    const honesty = deriveGovernanceFindingsArchitectureScopeHonesty(allRows, architectureScopedRows, true);

    expect(honesty.hiddenCount).toBe(1);
    expect(honesty.line).toBe("1 finding from other architectures hidden");
  });
});
