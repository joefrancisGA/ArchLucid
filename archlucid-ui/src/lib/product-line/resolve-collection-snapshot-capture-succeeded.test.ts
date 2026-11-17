import { describe, expect, it } from "vitest";

import { resolveCollectionSnapshotCaptureSucceeded } from "./resolve-collection-snapshot-capture-succeeded";

describe("resolveCollectionSnapshotCaptureSucceeded", () => {
  it("treats a succeeded snapshot as capture even when the caller has no pull", () => {
    expect(
      resolveCollectionSnapshotCaptureSucceeded({
        callerSnapshotCaptureSucceeded: null,
        snapshotCaptureStatuses: ["Succeeded"],
      }),
    ).toBe(true);
  });

  it("keeps the caller value when the snapshot list cannot be loaded", () => {
    expect(
      resolveCollectionSnapshotCaptureSucceeded({
        callerSnapshotCaptureSucceeded: null,
        snapshotCaptureStatuses: null,
      }),
    ).toBeNull();
  });

  it("does not clear a caller pull when the loaded page has no succeeded snapshot", () => {
    expect(
      resolveCollectionSnapshotCaptureSucceeded({
        callerSnapshotCaptureSucceeded: true,
        snapshotCaptureStatuses: ["Failed"],
      }),
    ).toBe(true);
  });
});
