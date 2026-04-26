import { describe, expect, it } from "vitest";

import { deriveRunListPipelineLabel } from "@/components/RunStatusBadge";
import { runFromDetailToRunSummary } from "@/lib/run-summary-from-detail";

describe("runFromDetailToRunSummary", () => {
  it("maps snapshot IDs to boolean flags for pipeline label derivation", () => {
    const run = runFromDetailToRunSummary({
      runId: "r1",
      projectId: "p1",
      createdUtc: "2026-01-01T00:00:00Z",
      contextSnapshotId: "c1",
      graphSnapshotId: "g1",
      findingsSnapshotId: null,
      goldenManifestId: null,
    });

    expect(run.hasContextSnapshot).toBe(true);
    expect(run.hasGraphSnapshot).toBe(true);
    expect(run.hasFindingsSnapshot).toBe(false);
    expect(deriveRunListPipelineLabel(run)).toBe("In pipeline");
  });
});
