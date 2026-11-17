import { describe, expect, it } from "vitest";

import { archiveReview } from "@/lib/api/review-archive-api";
import { replayRun } from "@/lib/api/recommendation-replay-api";
import { trimRequiredPathSegment } from "@/lib/api/api-boundary-normalization";

describe("run and learning boundary", () => {
  it("rejects a blank run id before archive", async () => {
    await expect(archiveReview("   ")).rejects.toThrow("runId is required.");
  });

  it("rejects an unrecognized replay mode", async () => {
    await expect(replayRun("00000000-0000-0000-0000-000000000001", "BadMode")).rejects.toThrow(
      "Replay mode was not recognized.",
    );
  });

  it("rejects a blank path segment", () => {
    expect(() => trimRequiredPathSegment("  ", "runId")).toThrow("runId is required.");
  });
});