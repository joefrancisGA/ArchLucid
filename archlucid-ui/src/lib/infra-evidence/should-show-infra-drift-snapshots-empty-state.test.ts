import { describe, expect, it } from "vitest";

import { shouldShowInfraDriftSnapshotsEmptyState } from "./should-show-infra-drift-snapshots-empty-state";

describe("shouldShowInfraDriftSnapshotsEmptyState", () => {
  it("hides the empty state while the list is loading or after a failed fetch", () => {
    expect(
      shouldShowInfraDriftSnapshotsEmptyState({
        loadingSnapshots: true,
        snapshotCount: 0,
        loadError: null,
      }),
    ).toBe(false);
    expect(
      shouldShowInfraDriftSnapshotsEmptyState({
        loadingSnapshots: false,
        snapshotCount: 0,
        loadError: "Upstream API unreachable",
      }),
    ).toBe(false);
  });

  it("shows the empty state only after a successful load with no rows", () => {
    expect(
      shouldShowInfraDriftSnapshotsEmptyState({
        loadingSnapshots: false,
        snapshotCount: 0,
        loadError: "   ",
      }),
    ).toBe(true);
  });
});
