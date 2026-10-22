/**
 * Requires ArchLucid.Api + SQL (DevelopmentBypass in default CI live lane).
 *
 * Canonical seeded showcase review → Deliverables → firm-branded consulting DOCX modal → POST consulting export + download.
 */
import path from "node:path";

import { expect, test } from "@playwright/test";

import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  openDemoWorkspaceReviewDetailShellReady,
} from "./helpers/demo-workspace-live-scope";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import {
  liveApiBase,
  liveE2eArchitectureRunCyclePlaywrightTimeoutMs,
  waitForAuthorityBuyerSummaryGoldenManifest,
} from "./helpers/live-api-client";
import { ensureBuyerDeliverablesSectionExpanded } from "./helpers/operator-journey";

test.describe("live-api-whitelabel-export", { tag: ["@founder"] }, () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }

    await ensureDemoWorkspaceSeedReady(request);
  });

  test("finalized showcase review: whitelabel consulting export modal fills packaging fields and downloads DOCX", async ({
    page,
    request,
  }) => {
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    await waitForAuthorityBuyerSummaryGoldenManifest(
      request,
      DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
      90_000,
      DEMO_WORKSPACE_A_LIVE_IDS,
    );
    await openDemoWorkspaceReviewDetailShellReady(
      page,
      DEMO_WORKSPACE_A_LIVE_IDS,
      DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
    );

    await ensureBuyerDeliverablesSectionExpanded(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID);

    const artifactsExports = page.locator("#artifacts-exports");

    // `#artifacts-exports` only renders once the run detail load resolves a golden manifest for
    // this seeded run — assert visibility explicitly (with a generous timeout) before scrolling,
    // rather than letting `scrollIntoViewIfNeeded` alone absorb the wait under shared-API load.
    await expect(artifactsExports).toBeVisible({ timeout: 90_000 });
    await artifactsExports.scrollIntoViewIfNeeded();

    // Buyer-polished shell (product default) omits the whitelabel modal CTA — detect after expand.
    const buyerPolishedDeliverables = page.getByTestId("buyer-deliverables-artifact-tabs");
    const openModal = page.getByTestId("open-whitelabel-consulting-export");

    if (
      (await buyerPolishedDeliverables.isVisible().catch(() => false)) ||
      !(await openModal.isVisible().catch(() => false))
    ) {
      test.skip(
        true,
        "Whitelabel consulting export modal is full-operator-only; buyer-polished live CI omits open-whitelabel-consulting-export.",
      );
    }

    await expect(openModal).toBeVisible({ timeout: 60_000 });

    await openModal.click();

    await expect(page.getByTestId("whitelabel-export-modal")).toBeVisible();

    await page.getByTestId("whitelabel-firm-display-name").fill("E2E Firm QA");

    await page.getByTestId("whitelabel-client-engagement-title").fill("E2E Engagement — packaging smoke");

    const logoFixturePath = path.join(process.cwd(), "public", "logo", "icon-192.png");

    await page.getByTestId("whitelabel-logo-file").setInputFiles(logoFixturePath);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes("/analysis-report/export/docx/consulting") &&
          response.ok(),
        { timeout: 120_000 },
      ),
      page.getByTestId("whitelabel-consulting-export-submit").click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.docx$/i);
  });
});
