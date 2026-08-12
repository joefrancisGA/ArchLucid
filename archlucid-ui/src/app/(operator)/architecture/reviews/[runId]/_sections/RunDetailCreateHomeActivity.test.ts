import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE,
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES,
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO,
} from "@/lib/runs/run-detail-activity-sources";

const pageViewSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

const midDeferredSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailMidDeferredSections.tsx"),
  "utf8",
);

const sourcesPanelSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailActivitySourcesPanel.tsx"),
  "utf8",
);

describe("create-home Activity tab P0 wiring", () => {
  it("mounts activity sources constants from run-detail-activity-sources", () => {
    expect(sourcesPanelSource).toContain("RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES");
    expect(sourcesPanelSource).toContain("RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO");
    expect(sourcesPanelSource).toContain("RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE");
    expect(RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES.length).toBeGreaterThan(0);
    expect(RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE.length).toBeGreaterThan(0);
  });

  it("does not duplicate technology baseline inside create-home activity panel", () => {
    const activityPanelStart = pageViewSource.indexOf("run-detail-create-home-activity");
    const activityPanelEnd = pageViewSource.indexOf("submittedArchitecture:", activityPanelStart);

    expect(activityPanelStart).toBeGreaterThan(-1);
    expect(activityPanelEnd).toBeGreaterThan(activityPanelStart);

    const activityPanelSlice = pageViewSource.slice(activityPanelStart, activityPanelEnd);

    expect(activityPanelSlice).not.toContain("RunDetailTechnologyBaselineSection");
    expect(activityPanelSlice).toContain("RunDetailActivitySourcesPanel");
    expect(activityPanelSlice).toContain("Assessment progress");
    expect(activityPanelSlice).toContain("run-detail-activity-status-headline");
    expect(activityPanelSlice).toContain("buyerAssessmentCopy");
    expect(activityPanelSlice).toContain("includeSavingsSummary={false}");
    expect(activityPanelSlice).toContain("(as of");
  });

  it("supports skipping savings summary in mid deferred sections", () => {
    expect(midDeferredSource).toContain("includeSavingsSummary");
  });
});
