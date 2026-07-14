/**
 * Merge-blocking live operator journey: same four-step pilot spine as `tests/core-pilot-path.spec.ts`,
 * against Sql + DevelopmentBypass API (seeded Workspace A Product Tour run). See `e2e/smoke.spec.ts` for mock showcase IDs.
 */
import { expect, test } from "@playwright/test";

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator-home-recent-reviews-heading";

import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import { expectBuyerGoldenPageReady } from "./helpers/buyer-golden-path";
import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  injectDemoWorkspaceOperatorScope,
} from "./helpers/demo-workspace-live-scope";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import { resolveLiveAuthMode, waitForLiveApiReady } from "./helpers/live-api-client";
import { ensureBuyerDeliverablesSectionExpanded } from "./helpers/operator-journey";
import { reviewsHubPackageRow, reviewsHubRecentPackagesSection } from "./helpers/reviews-hub";

const liveProductTourRunEnc = encodeURIComponent(DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID);
const liveReviewsListHref = `/reviews?projectId=${encodeURIComponent(DEMO_WORKSPACE_A_LIVE_IDS.projectId)}`;

test.describe("live-api-core-pilot-path", () => {
  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request);

    await ensureDemoWorkspaceSeedReady(request);
  });

  test("operator home, new request, reviews list, showcase review deliverables", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    // TB-347 consolidated the home reviews-zone heading to OPERATOR_HOME_RECENT_REVIEWS_HEADING
    // ("Workspace activity") across both operator shells; the old "Architecture reviews" h3 is
    // now rendered with `hideHeading` and never shown (see OperatorHomePageView.tsx).
    await expect(
      page.getByRole("heading", { name: OPERATOR_HOME_RECENT_REVIEWS_HEADING, level: 2 }),
    ).toBeVisible();

    await page.goto("/reviews/new");
    await expect(page.getByRole("heading", { name: CREATE_ARCHITECTURE_LABEL, level: 2 })).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    if (resolveLiveAuthMode() === "bypass") {
      await injectDemoWorkspaceOperatorScope(page, DEMO_WORKSPACE_A_LIVE_IDS);
    }

    await page.goto(liveReviewsListHref);
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
    await expect(reviewsHubRecentPackagesSection(getAppMain(page))).toBeVisible({ timeout: 60_000 });
    await expect(reviewsHubPackageRow(getAppMain(page), DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID)).toBeVisible({
      timeout: 60_000,
    });

    await page.goto(`/reviews/${liveProductTourRunEnc}`);
    await expect(getAppMain(page)).not.toContainText(/Something went wrong/i);
    await expectBuyerGoldenPageReady(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });

    await ensureBuyerDeliverablesSectionExpanded(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID);
    const deliverablesRegion = page.getByRole("region", { name: "Deliverables grouped by audience" });
    await expect(deliverablesRegion).toBeVisible();
    await expect(deliverablesRegion.getByRole("columnheader", { name: "Output" })).toHaveCount(2);
  });
});
