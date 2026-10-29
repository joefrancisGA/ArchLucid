import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { useGovernanceFindingTriage } from "@/components/governance/findings/use-governance-finding-triage";

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

describe("useGovernanceFindingTriage", () => {
  it("opens triage for a row matched by trimmed finding id", () => {
    const padded = findingRow("  finding-a  ");
    const { result } = renderHook(() => useGovernanceFindingTriage([padded]));

    act(() => {
      result.current.openForRow({ ...padded, findingId: "finding-a" });
    });

    expect(result.current.open).toBe(true);
    expect(result.current.activeRow?.findingId).toBe("  finding-a  ");
  });
});
