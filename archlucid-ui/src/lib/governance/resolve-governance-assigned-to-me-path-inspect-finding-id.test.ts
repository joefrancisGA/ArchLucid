import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  governanceAssignedToMePathInspectFindingIdSet,
  resolveGovernanceAssignedToMePathInspectFindingId,
} from "@/lib/governance/resolve-governance-assigned-to-me-path-inspect-finding-id";

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

describe("resolveGovernanceAssignedToMePathInspectFindingId", () => {
  const available = governanceAssignedToMePathInspectFindingIdSet([
    findingRow("finding-a"),
    findingRow("finding-b"),
  ]);

  it("prefers a sole bulk selection when it matches a visible finding", () => {
    expect(
      resolveGovernanceAssignedToMePathInspectFindingId({
        selectedFindingIds: new Set(["finding-a"]),
        urlFindingId: "finding-b",
        availableFindingIds: available,
      }),
    ).toBe("finding-a");
  });

  it("falls back to url findingId when bulk selection is empty or ambiguous", () => {
    expect(
      resolveGovernanceAssignedToMePathInspectFindingId({
        selectedFindingIds: new Set(),
        urlFindingId: "finding-b",
        availableFindingIds: available,
      }),
    ).toBe("finding-b");

    expect(
      resolveGovernanceAssignedToMePathInspectFindingId({
        selectedFindingIds: new Set(["finding-a", "finding-b"]),
        urlFindingId: "finding-b",
        availableFindingIds: available,
      }),
    ).toBe("finding-b");
  });

  it("returns null when no durable cursor matches visible rows", () => {
    expect(
      resolveGovernanceAssignedToMePathInspectFindingId({
        selectedFindingIds: new Set(["missing"]),
        urlFindingId: "also-missing",
        availableFindingIds: available,
      }),
    ).toBeNull();
  });

  it("ignores decision rows when building the available id set", () => {
    const set = governanceAssignedToMePathInspectFindingIdSet([
      findingRow("finding-1"),
      { ...findingRow("decision-1"), recordKind: "decision" },
    ]);

    expect(set.has("finding-1")).toBe(true);
    expect(set.has("decision-1")).toBe(false);
  });

  it("trims padded finding ids in register rows", () => {
    const set = governanceAssignedToMePathInspectFindingIdSet([findingRow("  finding-a  ")]);

    expect(set.has("finding-a")).toBe(true);
  });
});
