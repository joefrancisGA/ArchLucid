import { describe, expect, it, vi } from "vitest";

import {
  formatRunHomeListInsightLine,
  formatRunHomeListUpdatedLabel,
  resolveRunFindingCountDisplay,
} from "@/lib/operator-home-run-list-insight";
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
      "4 findings ready · finalize manifest to lock governance posture",
    );
  });

  it("formats relative updated labels from createdUtc", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00Z"));

    const run = stubRun({ createdUtc: "2026-06-15T12:00:00Z" });

    expect(formatRunHomeListUpdatedLabel(run)).toMatch(/^Updated .+/);

    vi.useRealTimers();
  });
});
