/**

 * Sponsor ROI dashboard Playwright coverage — rendering + cross-run finding deduplication.

 *

 * Mock API payloads: `e2e/fixtures/sponsor-roi-dashboard-mock.ts` (wired via `screenshot-mock-fallback.ts`).

 */

import { expect, test } from "@playwright/test";



import {

  SPONSOR_ROI_DASHBOARD_PATHS,

  awaitSponsorRoiDashboardReady,

  expectSponsorRoiDashboardShell,

  expectSponsorRoiSponsorSurface,

  expectSponsorRoiFindingDeduplication,

  expectSponsorRoiPortfolioPanels,

  expectSponsorRoiEnvironmentPieVisible,

  expectNoSponsorRoiDashboardErrorBoundary,

  prepareSponsorRoiDashboardProxyWaits,
  registerSponsorRoiDashboardDeterministicProxyRoutes,
} from "./helpers/sponsor-roi-dashboard";



/** Mock dashboard waits on export fetch (60s) plus panel hydration on cold CI agents. */

test.describe.configure({ mode: "serial", timeout: 120_000 });



test.describe("sponsor ROI dashboard — operator /architecture/sponsor-dashboard", () => {

  test("renders portfolio summary, KPI tiles, and trend chart without error boundary @smoke @sponsor-roi-dashboard", async ({

    page,

  }) => {

    await registerSponsorRoiDashboardDeterministicProxyRoutes(page);
    const roiWaits = prepareSponsorRoiDashboardProxyWaits(page);

    await page.goto(SPONSOR_ROI_DASHBOARD_PATHS.operator);



    await expectSponsorRoiDashboardShell(page);

    await expectNoSponsorRoiDashboardErrorBoundary(page);

    await awaitSponsorRoiDashboardReady(page, roiWaits);

    await roiWaits.exportPayload;

    await expectSponsorRoiPortfolioPanels(page);

    await expectSponsorRoiEnvironmentPieVisible(page);

    await expect(page.getByRole("heading", { level: 2, name: "Business impact summary" })).toBeVisible();

  });



  // Sidebar "Sponsor dashboard" and the retired standalone /sponsor/dashboard route render the

  // same portfolio layout (TB-608 consolidation) — assert the previously sponsor-only sections here too.

  test("renders decisions-needed, value-narrative, and sponsor-exports sections @sponsor-roi-dashboard", async ({

    page,

  }) => {

    await registerSponsorRoiDashboardDeterministicProxyRoutes(page);
    const roiWaits = prepareSponsorRoiDashboardProxyWaits(page);

    await page.goto(SPONSOR_ROI_DASHBOARD_PATHS.operator);



    await expectSponsorRoiDashboardShell(page);

    await expectNoSponsorRoiDashboardErrorBoundary(page);

    await awaitSponsorRoiDashboardReady(page, roiWaits);

    await expectSponsorRoiSponsorSurface(page);

    await roiWaits.exportPayload;

    await expect(page.getByTestId("exec-roi-identified-vs-realized-panel")).toBeVisible({ timeout: 30_000 });

    await expectSponsorRoiEnvironmentPieVisible(page);

  });



  test("export contract and UI reflect deduplicated findings across runs @sponsor-roi-dashboard", async ({

    page,

  }) => {

    await registerSponsorRoiDashboardDeterministicProxyRoutes(page);
    const roiWaits = prepareSponsorRoiDashboardProxyWaits(page);

    await page.goto(SPONSOR_ROI_DASHBOARD_PATHS.operator);



    await expectSponsorRoiDashboardShell(page);

    await awaitSponsorRoiDashboardReady(page, roiWaits);

    await expectSponsorRoiFindingDeduplication(page, await roiWaits.exportPayload);

  });

  test("systemic issue rollup matches deduplicated export rows @sponsor-roi-dashboard", async ({ page }) => {

    await registerSponsorRoiDashboardDeterministicProxyRoutes(page);
    const roiWaits = prepareSponsorRoiDashboardProxyWaits(page);

    await page.goto(SPONSOR_ROI_DASHBOARD_PATHS.operator);



    await expectSponsorRoiDashboardShell(page);

    await expectNoSponsorRoiDashboardErrorBoundary(page);

    await awaitSponsorRoiDashboardReady(page, roiWaits);

    const exportPayload = await roiWaits.exportPayload;

    await expectSponsorRoiSponsorSurface(page);

    await expectSponsorRoiFindingDeduplication(page, exportPayload);

  });



  test("retired /sponsor/dashboard route surfaces branded not-found @sponsor-roi-dashboard", async ({ page }) => {
    await page.goto(SPONSOR_ROI_DASHBOARD_PATHS.legacySponsor);

    await expect(page).toHaveURL(/\/sponsor\/dashboard$/);
    await expect(page.getByTestId("branded-not-found")).toBeVisible();
  });

  test("retired /portfolio route surfaces branded not-found @sponsor-roi-dashboard", async ({ page }) => {
    await page.goto(SPONSOR_ROI_DASHBOARD_PATHS.legacyPortfolio);

    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(page.getByTestId("branded-not-found")).toBeVisible();
  });
  test("retired /sponsor/reviews route redirects to /reviews @sponsor-roi-dashboard", async ({ page }) => {

    await page.goto(SPONSOR_ROI_DASHBOARD_PATHS.legacySponsorReviews);



    await expect(page).toHaveURL(/\/reviews$/);

  });

});
