import { describe, expect, it } from "vitest";

import {
  bothRunsReadyForBranchCompare,
  whatIfAutoCompareDoneStorageKey,
} from "./draft-branch-auto-compare";

describe("bothRunsReadyForBranchCompare", () => {
  it("returns true only when parent and branch both committed manifests", () => {
    expect(
      bothRunsReadyForBranchCompare(
        { hasGoldenManifest: true },
        { hasGoldenManifest: true },
      ),
    ).toBe(true);

    expect(
      bothRunsReadyForBranchCompare(
        { hasGoldenManifest: true },
        { hasGoldenManifest: false },
      ),
    ).toBe(false);
  });
});

describe("whatIfAutoCompareDoneStorageKey", () => {
  it("keys auto-compare completion per parent/branch pair", () => {
    expect(whatIfAutoCompareDoneStorageKey("parent", "branch")).toContain("parent");
    expect(whatIfAutoCompareDoneStorageKey("parent", "branch")).toContain("branch");
  });
});
