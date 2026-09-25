import { beforeEach, describe, expect, it } from "vitest";

import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  DRIFT_LAST_COMPARISON_SELECTION_STORAGE_KEY,
  readDriftLastComparisonSelection,
  validateDriftLastComparisonSelection,
  writeDriftLastComparisonSelection,
} from "@/lib/infra-evidence/infra-evidence-drift-last-comparison-storage";

const snapshot: InfraEvidenceSnapshotSummary = {
  snapshotId: "11111111-1111-1111-1111-111111111111",
  subscriptionId: "sub-1",
  subscriptionName: "Prod",
  capturedUtc: "2026-09-01T12:00:00Z",
  captureStatus: 1,
  resourceCount: 10,
  relationshipCount: 2,
};

const diff: InfraEvidenceDiffSummary = {
  diffId: "diff-1",
  snapshotAId: snapshot.snapshotId,
  snapshotBId: "22222222-2222-2222-2222-222222222222",
  subscriptionId: "sub-1",
  totalChanges: 1,
  resourceAddedCount: 0,
  resourceRemovedCount: 0,
  resourceModifiedCount: 1,
  createdUtc: "2026-09-02T12:00:00Z",
};

describe("infra-evidence-drift-last-comparison-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a last comparison selection", () => {
    writeDriftLastComparisonSelection({
      snapshotId: snapshot.snapshotId,
      diffId: diff.diffId,
      changeId: "change-1",
    });

    expect(readDriftLastComparisonSelection()).toEqual({
      snapshotId: snapshot.snapshotId,
      diffId: diff.diffId,
      changeId: "change-1",
    });
    expect(window.localStorage.getItem(DRIFT_LAST_COMPARISON_SELECTION_STORAGE_KEY)).not.toBeNull();
  });

  it("validates stored ids against loaded snapshots and diffs", () => {
    const stored = {
      snapshotId: snapshot.snapshotId,
      diffId: diff.diffId,
      changeId: "change-1",
    };

    expect(validateDriftLastComparisonSelection(stored, [snapshot], [diff])).toEqual(stored);
    expect(validateDriftLastComparisonSelection(stored, [], [diff])).toBeNull();
    expect(
      validateDriftLastComparisonSelection(
        { snapshotId: snapshot.snapshotId, diffId: "missing", changeId: "" },
        [snapshot],
        [diff],
      ),
    ).toBeNull();
    expect(
      validateDriftLastComparisonSelection(
        { snapshotId: snapshot.snapshotId, diffId: "missing", changeId: "" },
        [snapshot],
        [],
      )?.diffId,
    ).toBe("missing");
  });
});
