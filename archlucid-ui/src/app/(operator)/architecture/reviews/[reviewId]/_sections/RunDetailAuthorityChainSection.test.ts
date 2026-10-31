import { describe, expect, it } from "vitest";

import {
  resolveArtifactBundleIdLabel,
  resolveContextSnapshotIdLabel,
  resolveDecisionTraceIdLabel,
  resolveFinalizedReviewRecordLabel,
  resolveFindingsSnapshotIdLabel,
  resolveGraphSnapshotIdLabel,
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
    expect(resolveArtifactBundleIdLabel("")).toBe("Artifact bundle id was stored empty.");
    expect(resolveArtifactBundleIdLabel("bundle-1")).toBe("bundle-1");
  });

  it("uses per-id omission copy for authority chain snapshot pointers (P-14)", () => {
    expect(resolveContextSnapshotIdLabel(null)).toBe("Context snapshot id was not stored.");
    expect(resolveGraphSnapshotIdLabel(undefined)).toBe("Graph snapshot id was not stored.");
    expect(resolveFindingsSnapshotIdLabel(null)).toBe("Findings snapshot id was not stored.");
    expect(resolveDecisionTraceIdLabel(undefined)).toBe("Decision trace id was not stored.");
    expect(resolveContextSnapshotIdLabel("ctx-1")).toBe("ctx-1");
    expect(resolveGraphSnapshotIdLabel("")).toBe("Graph snapshot id was stored empty.");
  });
});
