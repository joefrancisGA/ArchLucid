import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SPONSOR_DASHBOARD_VIEW_PATH =
  "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiDashboardPageView.tsx";

const COMPARE_VERDICT_CHROME_PATH =
  "src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx";

function readUiSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("sponsor and compare honesty wiring guard (WA-08 / WA-09)", () => {
  it("mounts sponsor review coverage honesty above KPI sections", () => {
    const source = readUiSource(SPONSOR_DASHBOARD_VIEW_PATH);

    expect(source).toContain("SponsorDashboardReviewCoverageHonestyStrip");
    expect(source).toContain("scopedReviewId={selectedReviewId}");
  });

  it("mounts compare provenance delta band in verdict chrome", () => {
    const source = readUiSource(COMPARE_VERDICT_CHROME_PATH);

    expect(source).toContain("CompareProvenanceDeltaBand");
    expect(source).toContain("manifestDiffs={result?.manifestComparison?.diffs}");
  });
});
