import { describe, expect, it } from "vitest";

import {
  collectSecurityEvidencePathIdsFromAttackPathReport,
  computeSecureNowCapturePathDelta,
  formatSecureNowCapturePathDeltaList,
  isSecureNowCapturePathDeltaEligibleSnapshot,
} from "@/lib/product-line/securenow-capture-path-delta";

describe("securenow-capture-path-delta", () => {
  it("treats only succeeded captures as eligible", () => {
    expect(isSecureNowCapturePathDeltaEligibleSnapshot("Succeeded")).toBe(true);
    expect(isSecureNowCapturePathDeltaEligibleSnapshot("Partial")).toBe(false);
    expect(isSecureNowCapturePathDeltaEligibleSnapshot("Failed")).toBe(false);
  });

  it("lists added, gone, and unchanged path ids between two captures", () => {
    const previous = collectSecurityEvidencePathIdsFromAttackPathReport({
      snapshotId: "snap-old",
      vulnerableAttackPaths: [
        { pathId: "path-gone", snapshotId: "snap-old" } as never,
        { pathId: "path-shared", snapshotId: "snap-old" } as never,
      ],
      unevaluatedGroups: [],
    });
    const latest = collectSecurityEvidencePathIdsFromAttackPathReport({
      snapshotId: "snap-new",
      vulnerableAttackPaths: [
        { pathId: "path-added", snapshotId: "snap-new" } as never,
        { pathId: "path-shared", snapshotId: "snap-new" } as never,
      ],
      unevaluatedGroups: [],
    });

    const delta = computeSecureNowCapturePathDelta(previous, latest);

    expect(delta.added).toEqual(["path-added"]);
    expect(delta.gone).toEqual(["path-gone"]);
    expect(delta.unchanged).toEqual(["path-shared"]);
    expect(formatSecureNowCapturePathDeltaList([])).toBe("None");
    expect(formatSecureNowCapturePathDeltaList(["path-a"])).toBe("path-a");
  });
});
