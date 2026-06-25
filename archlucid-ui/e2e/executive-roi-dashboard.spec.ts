/**
 * Executive ROI dashboard Playwright coverage — rendering + cross-run finding deduplication.
 *
 * Mock API payloads: `e2e/fixtures/executive-roi-dashboard-mock.ts` (wired via `screenshot-mock-fallback.ts`).
 */
import { expect, test } from "@playwright/test";

import {
  EXECUTIVE_ROI_DASHBOARD_PATHS,
  expectExecutiveRoiDashboardShell,
  expectExecutiveRoiExecutiveSurface,
  expectExecutiveRoiFindingDeduplication,
  expectExecutiveRoiPortfolioPanels,
  expectNoExecutiveRoiDashboardErrorBoundary,
  prepareExecutiveRoiDashboardProxyWaits,
} from "./helpers/executive-roi-dashboard";

/** Mock dashboard waits on export fetch (60s) plus panel hydration on cold CI agents. */
test.describe.configure({ mode: "serial", timeout: 90_000 });

test.describe("executive ROI dashboard — operator /dashboard", () => {
  test("renders portfolio summary, KPI tiles, and trend chart without error boundary @smoke @executive-roi-dashboard", async ({
    page,
  }) => {
    const roiWaits = prepareExecutiveRoiDashboardProxyWaits(page);
    await page.goto(EXECUTIVE_ROI_DASHBOARD_PATHS.operator);

    await expectExecutiveRoiDashboardShell(page);
    await expectNoExecutiveRoiDashboardErrorBoundary(page);
    await roiWaits.summaryResponse;
    await roiWaits.exportPayload;
    await expectExecutiveRoiPortfolioPanels(page);
    await expect(page.getByTestId("exec-roi-environment-pie")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Business impact summary" })).toBeVisible();
  });

  test("export contract and UI reflect deduplicated findings across runs @executive-roi-dashboard", async ({
    page,
  }) => {
    const roiWaits = prepareExecutiveRoiDashboardProxyWaits(page);
    await page.goto(EXECUTIVE_ROI_DASHBOARD_PATHS.operator);

    await expectExecutiveRoiDashboardShell(page);
    await roiWaits.summaryResponse;
    await expectExecutiveRoiFindingDeduplication(page, await roiWaits.exportPayload);
  });
});

test.describe("executive ROI dashboard — executive /executive/dashboard", () => {
  test("renders sponsor surface with committed-review panels @executive-roi-dashboard", async ({ page }) => {
    const roiWaits = prepareExecutiveRoiDashboardProxyWaits(page);
    await page.goto(EXECUTIVE_ROI_DASHBOARD_PATHS.executive);

    await expectExecutiveRoiDashboardShell(page);
    await expectNoExecutiveRoiDashboardErrorBoundary(page);
    await roiWaits.summaryResponse;
    await roiWaits.exportPayload;
    await expectExecutiveRoiExecutiveSurface(page);
    await expect(page.getByTestId("exec-roi-identified-vs-realized-panel")).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId("exec-roi-environment-pie")).toBeVisible();
  });

  test("systemic issue rollup matches deduplicated export rows @executive-roi-dashboard", async ({ page }) => {
    const roiWaits = prepareExecutiveRoiDashboardProxyWaits(page);
    await page.goto(EXECUTIVE_ROI_DASHBOARD_PATHS.executive);

    await expectExecutiveRoiDashboardShell(page);
    await expectNoExecutiveRoiDashboardErrorBoundary(page);
    await roiWaits.summaryResponse;
    const exportPayload = await roiWaits.exportPayload;
    await expectExecutiveRoiExecutiveSurface(page);
    await expectExecutiveRoiFindingDeduplication(page, exportPayload);
  });
});
