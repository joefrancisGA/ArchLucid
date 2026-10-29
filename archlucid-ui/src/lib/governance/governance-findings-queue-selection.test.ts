import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  governanceFindingsQueueAvailableFindingIdSet,
  isGovernanceQueueFindingIdSelected,
  normalizeGovernanceQueueFindingId,
} from "@/lib/governance/governance-findings-queue-selection";

function findingRow(findingId: string): GovernanceFindingQueueRow {
  return {
    recordKind: "finding",
    findingId,
    runId: "run-1",
    title: "Gap",
    severity: "High",
    agingDays: 1,
    revisitDueUtc: null,
    policyRuleId: null,
    disposition: "open",
    resourceId: null,
    resourceDisplayName: null,
    insightDensityScore: 50,
  } as GovernanceFindingQueueRow;
}

describe("governanceFindingsQueueAvailableFindingIdSet", () => {
  it("stores trimmed finding ids when register rows retain padding", () => {
    const set = governanceFindingsQueueAvailableFindingIdSet([findingRow("  finding-1  ")]);

    expect(set.has("finding-1")).toBe(true);
    expect(set.has("  finding-1  ")).toBe(false);
  });
});

describe("isGovernanceQueueFindingIdSelected", () => {
  it("matches padded row ids against trimmed bulk selection", () => {
    expect(
      isGovernanceQueueFindingIdSelected(new Set(["finding-1"]), "  finding-1  "),
    ).toBe(true);
  });

  it("ignores whitespace-only ids", () => {
    expect(isGovernanceQueueFindingIdSelected(new Set(["finding-1"]), "   ")).toBe(false);
    expect(normalizeGovernanceQueueFindingId("   ")).toBe("");
  });
});
