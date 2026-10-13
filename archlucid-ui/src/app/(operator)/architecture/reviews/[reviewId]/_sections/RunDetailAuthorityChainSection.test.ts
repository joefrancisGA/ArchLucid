import { describe, expect, it } from "vitest";

import {
  resolveArtifactBundleIdLabel,
  resolveFinalizedReviewRecordLabel,
} from "./RunDetailAuthorityChainSection";

describe("RunDetailAuthorityChainSection manifest label", () => {
  it("uses omission copy only when the manifest id is missing", () => {
    expect(resolveFinalizedReviewRecordLabel(null)).toBe("Finalized review record was not stored.");
    expect(resolveFinalizedReviewRecordLabel("   ")).toBe("Finalized review record was not stored.");
    expect(resolveFinalizedReviewRecordLabel("manifest-1")).toBe("Finalized review record");
  });

  it("distinguishes missing and stored artifact bundle ids", () => {
    expect(resolveArtifactBundleIdLabel(null)).toBe("Artifact bundle id was not stored.");
    expect(resolveArtifactBundleIdLabel(undefined)).toBe("Artifact bundle id was not stored.");
    expect(resolveArtifactBundleIdLabel("")).toBe("");
    expect(resolveArtifactBundleIdLabel("bundle-1")).toBe("bundle-1");
  });
});
