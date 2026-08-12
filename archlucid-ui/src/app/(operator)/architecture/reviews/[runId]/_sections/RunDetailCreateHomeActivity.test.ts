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

const activityPanelSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailCreateHomeActivityPanel.tsx"),
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

  it("delegates create-home activity to RunDetailCreateHomeActivityPanel (TB-1832/TB-1834)", () => {
    expect(pageViewSource).toContain("RunDetailCreateHomeActivityPanelDeferred");
    expect(activityPanelSource).toContain("run-detail-create-home-activity");
    expect(activityPanelSource).toContain("architecture-activity-primary-region");
    expect(activityPanelSource).toContain("architecture-activity-orientation");
    expect(activityPanelSource).toContain("architecture-activity-technical-detail");
    expect(activityPanelSource).not.toContain("RunDetailTechnologyBaselineSection");
    expect(activityPanelSource).toContain("run-detail-activity-status-headline");
    expect(activityPanelSource).toContain("buyerAssessmentCopy");
    expect(activityPanelSource).toContain("(as of");
  });

  it("supports skipping savings summary in mid deferred sections", () => {
    expect(midDeferredSource).toContain("includeSavingsSummary");
  });
});
