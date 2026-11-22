import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { deriveSponsorSynopsisPackageTitle, resolveGovernanceFindingRunIdFromDisplayedRows } from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

function findingRow(findingId: string, runId = "run-1"): GovernanceFindingQueueRow {
  return {
    recordKind: "finding",
    findingId,
    runId,
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

describe("resolveGovernanceFindingRunIdFromDisplayedRows", () => {
  it("matches keyboard focus tokens to padded register finding ids", () => {
    expect(
      resolveGovernanceFindingRunIdFromDisplayedRows([findingRow("  finding-a  ")], "finding-a"),
    ).toBe("run-1");
  });
});


describe("deriveSponsorSynopsisPackageTitle", () => {
  const first = { ...findingRow("finding-a", "run-1"), runLabel: "Payments review" };
  const second = { ...findingRow("finding-b", "run-2"), runLabel: "Retail review" };

  it("does not attribute counts from several visible reviews to the first review", () => {
    expect(deriveSponsorSynopsisPackageTitle([first, second], null)).toBe("this workspace");
    expect(deriveSponsorSynopsisPackageTitle([second, first], "")).toBe("this workspace");
  });

  it("keeps the review title for a single visible review or an explicitly scoped review", () => {
    const anotherFinding = { ...findingRow("finding-c", "run-1"), runLabel: "Payments review" };
    expect(deriveSponsorSynopsisPackageTitle([first, anotherFinding], null)).toBe("Payments review");
    expect(deriveSponsorSynopsisPackageTitle([first], "run-1")).toBe("Payments review");
  });
});
