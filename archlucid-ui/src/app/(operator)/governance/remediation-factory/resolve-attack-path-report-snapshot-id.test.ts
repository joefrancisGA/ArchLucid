import { describe, expect, it } from "vitest";

import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";

import {
  resolveAttackPathReportSnapshotId,
  shouldShowAttackPathReportRankedSnapshotHint,
} from "./resolve-attack-path-report-snapshot-id";

function rankRow(snapshotId: string, rankOrder: number): SecurityEvidencePathRankSummary {
  return {
    pathId: "11111111-1111-1111-1111-111111111111",
    snapshotId,
    rankOrder,
    ruleVersion: "v1",
    technicalExposureScore: 1,
    privilegeDepthScore: 1,
    blastRadiusScore: 1,
    businessConsequenceScore: null,
    confidenceBandScore: 1,
    compositeSortScore: 1,
    explanationSummary: "summary",
    pathKind: "Privilege",
    pathConfidenceBand: "Confirmed",
    computedUtc: "2026-01-01T00:00:00Z",
    relatedCutPoints: [],
  };
}

describe("resolveAttackPathReportSnapshotId", () => {
  it("prefers toSnapshotId over ranked rows", () => {
    const snapshotId = resolveAttackPathReportSnapshotId(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      null,
      [rankRow("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", 1)],
      false,
    );

    expect(snapshotId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  });

  it("uses first ranked path by rankOrder when no pair is selected", () => {
    const snapshotId = resolveAttackPathReportSnapshotId(
      null,
      null,
      [
        rankRow("second-snapshot", 2),
        rankRow("first-snapshot", 1),
      ],
      false,
    );

    expect(snapshotId).toBe("first-snapshot");
  });

  it("returns null while ranked paths are loading without a pair", () => {
    expect(resolveAttackPathReportSnapshotId(null, null, [], true)).toBeNull();
  });

  it("shows ranked snapshot hint when multiple snapshots appear on the page", () => {
    expect(
      shouldShowAttackPathReportRankedSnapshotHint(
        null,
        null,
        [rankRow("one", 1), rankRow("two", 2)],
      ),
    ).toBe(true);
  });
});
