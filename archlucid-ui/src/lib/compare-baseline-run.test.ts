import { afterEach, describe, expect, it } from "vitest";

import {
  COMPARE_BASELINE_RUN_STORAGE_KEY,
  isRunCommittedForBaseline,
  persistCompareBaselineRunId,
  readCompareBaselineRunId,
} from "@/lib/compare-baseline-run";
import type { RunSummary } from "@/types/authority";

function minimalRun(overrides: Partial<RunSummary>): RunSummary {
  return {
    runId: "r1",
    projectId: "default",
    createdUtc: "2024-01-01T00:00:00Z",
    description: "d",
    ...overrides,
  };
}

describe("compare-baseline-run", () => {
  afterEach(() => {
    window.localStorage.removeItem(COMPARE_BASELINE_RUN_STORAGE_KEY);
  });

  it("isRunCommittedForBaseline respects hasGoldenManifest", () => {
    expect(isRunCommittedForBaseline(minimalRun({ hasGoldenManifest: false }))).toBe(false);
    expect(isRunCommittedForBaseline(minimalRun({ hasGoldenManifest: true }))).toBe(true);
  });

  it("persists and reads baseline run id", () => {
    expect(readCompareBaselineRunId()).toBeNull();
    persistCompareBaselineRunId("abc-123");
    expect(readCompareBaselineRunId()).toBe("abc-123");
  });

  it("ignores empty persist", () => {
    persistCompareBaselineRunId("   ");
    expect(readCompareBaselineRunId()).toBeNull();
  });
});
