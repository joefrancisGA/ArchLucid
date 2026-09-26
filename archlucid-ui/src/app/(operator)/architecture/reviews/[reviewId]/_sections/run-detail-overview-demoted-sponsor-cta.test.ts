import { describe, expect, it } from "vitest";

import { deriveRunDetailProgressState } from "./derive-run-detail-progress-state";
import { shouldShowOverviewDemotedSponsorReportCta } from "./run-detail-overview-demoted-sponsor-cta";

describe("shouldShowOverviewDemotedSponsorReportCta", () => {
  it("does not show sponsor CTA while analysis is in flight even when goldenManifestId is set", () => {
    const run = {
      runId: "run-partial-golden",
      createdUtc: "2026-08-01T12:00:00Z",
      completedUtc: null,
      legacyRunStatus: "Running",
      goldenManifestId: "manifest-early",
      description: "Partial pipeline",
    };
    const progress = {
      runId: run.runId,
      description: run.description,
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    };

    const { runCompleted } = deriveRunDetailProgressState(run, run.goldenManifestId, progress);
    const legacyOverviewCompleted =
      run.legacyRunStatus === "Completed" || Boolean(run.goldenManifestId);

    expect(legacyOverviewCompleted).toBe(true);
    expect(runCompleted).toBe(false);
    expect(shouldShowOverviewDemotedSponsorReportCta(false, runCompleted)).toBe(false);
    expect(shouldShowOverviewDemotedSponsorReportCta(false, legacyOverviewCompleted)).toBe(true);
  });
});
