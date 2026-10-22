import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  filterInfraEvidenceDiffsAfterAnchorSnapshot,
  isInfraEvidenceDiffCapturedAfterAnchorSnapshot,
} from "@/lib/infra-evidence/infra-evidence-drift-diff-filter";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "sub-prod",
    subscriptionName: "Prod",
    capturedUtc: "2026-09-01T12:00:00Z",
    captureStatus: 1,
    resourceCount: 10,
    relationshipCount: 2,
    ...overrides,
  };
}

function diff(overrides: Partial<InfraEvidenceDiffSummary> = {}): InfraEvidenceDiffSummary {
  return {
    diffId: "diff-1",
    snapshotAId: "11111111-1111-1111-1111-111111111111",
    snapshotBId: "22222222-2222-2222-2222-222222222222",
    subscriptionId: "sub-prod",
    totalChanges: 1,
    resourceAddedCount: 0,
    resourceRemovedCount: 0,
    resourceModifiedCount: 1,
    createdUtc: "2026-09-02T12:00:00Z",
    ...overrides,
  };
}

describe("infra-evidence-drift-diff-filter", () => {
  it("includes diffs whose other snapshot was captured after the anchor", () => {
    const anchor = snapshot();
    const later = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      capturedUtc: "2026-09-08T12:00:00Z",
    });

    expect(
      isInfraEvidenceDiffCapturedAfterAnchorSnapshot(diff(), anchor, [anchor, later]),
    ).toBe(true);
  });

  it("excludes diffs whose other snapshot was captured before the anchor", () => {
    const anchor = snapshot();
    const earlier = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      capturedUtc: "2026-08-15T12:00:00Z",
    });

    expect(
      isInfraEvidenceDiffCapturedAfterAnchorSnapshot(diff(), anchor, [anchor, earlier]),
    ).toBe(false);
  });

  it("excludes diffs captured at the same instant as the anchor", () => {
    const anchor = snapshot();
    const sameTime = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      capturedUtc: "2026-09-01T12:00:00Z",
    });

    expect(
      isInfraEvidenceDiffCapturedAfterAnchorSnapshot(diff(), anchor, [anchor, sameTime]),
    ).toBe(false);
  });

  it("falls back to diff createdUtc when the other snapshot capture time is missing", () => {
    const anchor = snapshot();
    const otherWithoutCapture = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      capturedUtc: null,
    });

    expect(
      isInfraEvidenceDiffCapturedAfterAnchorSnapshot(
        diff({ createdUtc: "2026-09-08T12:00:00Z" }),
        anchor,
        [anchor, otherWithoutCapture],
      ),
    ).toBe(true);
  });

  it("filters a diff list to later-than-anchor comparisons only", () => {
    const anchor = snapshot();
    const later = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      capturedUtc: "2026-09-08T12:00:00Z",
    });
    const earlier = snapshot({
      snapshotId: "33333333-3333-3333-3333-333333333333",
      capturedUtc: "2026-08-15T12:00:00Z",
    });

    expect(
      filterInfraEvidenceDiffsAfterAnchorSnapshot(
        [
          diff({ diffId: "diff-later", snapshotBId: later.snapshotId }),
          diff({ diffId: "diff-earlier", snapshotBId: earlier.snapshotId }),
        ],
        anchor,
        [anchor, later, earlier],
      ).map((row) => row.diffId),
    ).toEqual(["diff-later"]);
  });
});
