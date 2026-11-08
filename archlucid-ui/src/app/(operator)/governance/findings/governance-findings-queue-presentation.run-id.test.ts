import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { resolveGovernanceFindingRunIdFromDisplayedRows } from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

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
