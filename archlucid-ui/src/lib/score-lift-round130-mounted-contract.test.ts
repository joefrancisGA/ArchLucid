import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round130 mounted contract", () => {
  it("upload success, collection blocker, and health tiles", () => {
    const zip = readUiSource("app/(operator)/administration/extract-upload/_sections/ExtractUploadZipDropShell.tsx");
    expect(zip).toContain('data-testid="extract-upload-success"');
    expect(zip).toContain('data-testid="extract-upload-evaluation-pending-not-load-failure"');
    const home = readUiSource("app/(operator)/_sections/OperatorHomePageView.tsx");
    const reviews = readUiSource("app/(operator)/architecture/reviews/_sections/ReviewsHubOpenGateCollectionBlockerHost.tsx");
    const strip = readUiSource("components/operator-home/OperatorHomeSecureNowCollectionBlockerStrip.tsx");
    expect(home).toContain("OperatorHomeSecureNowCollectionBlockerStrip");
    expect(reviews).toContain("OperatorHomeSecureNowCollectionBlockerStrip");
    expect(strip).toContain("SecureNowCollectionPrimaryBlockerLine");
    const liveHealth = readUiSource("app/(operator)/administration/system-health/_sections/SystemHealthPageView.tsx");
    const demoHealth = readUiSource("app/(operator)/administration/system-health/_sections/SystemHealthDemoPageView.tsx");
    expect(liveHealth).toContain("perTilePointInTimeHonestyLine={SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE}");
    expect(demoHealth).toContain("perTilePointInTimeHonestyLine={SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE}");
    const grid = readUiSource("components/health-dashboard/HealthDashboardSections.tsx");
    expect(grid).toContain("data-testid={`${props.testId}-${tile.id}-point-in-time-not-load-failure`}");
    const kpi = readUiSource("components/SponsorWorkspaceHealthKpiBlocks.tsx");
    expect(kpi).toContain('data-testid="workspace-health-kpi-card-point-in-time-not-load-failure"');
  });
});
