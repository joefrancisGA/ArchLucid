import { describe, expect, it, vi } from "vitest";

import {
  formatRunHomeListInsightLine,
  formatRunHomeListUpdatedLabel,
  resolveRunFindingCountDisplay,
} from "@/lib/operator/operator-home-run-list-insight";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

function stubRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-a",
    projectId: "default",
    createdUtc: "2026-06-01T12:00:00Z",
    ...overrides,
  };
}

describe("operator-home-run-list-insight", () => {
  it("uses showcase spine counts for the static demo run", () => {
    const run = stubRun({ runId: SHOWCASE_STATIC_DEMO_RUN_ID, hasGoldenManifest: true });

    expect(resolveRunFindingCountDisplay(run)).toBe(9);
    expect(formatRunHomeListInsightLine(run)).toContain("9 findings");
    expect(formatRunHomeListInsightLine(run)).toContain("package finalized");
  });

  it("describes in-progress reviews without a finalized manifest", () => {
    const run = stubRun({
      hasFindingsSnapshot: true,
      findingCount: 4,
    });

    expect(formatRunHomeListInsightLine(run)).toBe(
      "4 findings ready · finalize this review to lock export readiness",
    );
  });

  it("mentions monitoring on finalized packages with governance warnings", () => {
    const run = stubRun({
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
    });

    expect(formatRunHomeListInsightLine(run)).toBe("Package finalized · monitoring active");
  });

  it("formats relative updated labels from createdUtc", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00Z"));

    const run = stubRun({ createdUtc: "2026-06-15T12:00:00Z" });

    expect(formatRunHomeListUpdatedLabel(run)).toEqual({
      isoUtc: "2026-06-15T12:00:00Z",
      absoluteLabel: expect.any(String),
      relativeLabel: expect.any(String),
      zoneLabel: "Updated",
    });

    expect(formatRunHomeListUpdatedLabel(run, "home-recent-reviews").zoneLabel).toBe("Recent reviews");

    vi.useRealTimers();
  });
});
