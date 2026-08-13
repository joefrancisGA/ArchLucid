/**
 * Merge-blocking live operator journey: same four-step pilot spine as `tests/core-pilot-path.spec.ts`,
 * against Sql + DevelopmentBypass API (seeded Workspace A Product Tour run). See `e2e/smoke.spec.ts` for mock showcase IDs.
 */
import { expect, test } from "@playwright/test";

import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator/operator-home-recent-reviews-heading";

import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import { expectBuyerGoldenPageReady, expectNoGenericErrorBoundary } from "./helpers/buyer-golden-path";
import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  injectDemoWorkspaceOperatorScope,
} from "./helpers/demo-workspace-live-scope";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import { waitForLiveApiReady } from "./helpers/live-api-client";
import { expectLiveReviewsHubListReady } from "./helpers/live-page-readiness";
import { ensureBuyerDeliverablesSectionExpanded } from "./helpers/operator-journey";
import {
  reviewsHubFirstPackageRow,
  reviewsHubPackageRow,
  reviewsHubRecentPackagesSection,
} from "./helpers/reviews-hub";

const liveProductTourRunEnc = encodeURIComponent(DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID);
const liveReviewsListHref = `/architecture/reviews?projectId=${encodeURIComponent(DEMO_WORKSPACE_A_LIVE_IDS.projectId)}`;

test.describe("live-api-core-pilot-path", { tag: ["@founder", "@buyer-journey"] }, () => {
  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request);

    await ensureDemoWorkspaceSeedReady(request);
  });

  test("operator home, new request, reviews list, showcase review deliverables", async ({ page }) => {
    test.setTimeout(180_000);

    await injectDemoWorkspaceOperatorScope(page, DEMO_WORKSPACE_A_LIVE_IDS);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    // TB-347 consolidated the home reviews-zone heading to OPERATOR_HOME_RECENT_REVIEWS_HEADING
    // ("Workspace activity") across both operator shells; the old "Architecture reviews" h3 is
    // now rendered with `hideHeading` and never shown (see OperatorHomePageView.tsx).
    await expect(
      page.getByRole("heading", { name: OPERATOR_HOME_RECENT_REVIEWS_HEADING, level: 2 }),
    ).toBeVisible();

    await page.goto("/architecture/reviews/new");
    await expect(page.getByRole("heading", { name: START_REVIEW_LABEL, level: 1 })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("reviews-new-page-lead")).toBeVisible({ timeout: 60_000 });
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto(liveReviewsListHref);
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible({ timeout: 90_000 });
    await expectLiveReviewsHubListReady(page, {
      timeoutMs: 90_000,
      projectId: DEMO_WORKSPACE_A_LIVE_IDS.projectId,
    });

    const main = getAppMain(page);

    await expect(reviewsHubRecentPackagesSection(main)).toBeVisible({ timeout: 90_000 });

    const targetRow = reviewsHubPackageRow(main, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID).or(
      reviewsHubFirstPackageRow(main),
    );

    await expect(targetRow.first()).toBeVisible({ timeout: 90_000 });
    await expectNoGenericErrorBoundary(page);

    await page.goto(`/architecture/reviews/${liveProductTourRunEnc}`);
    await expectNoGenericErrorBoundary(page);
    await expectBuyerGoldenPageReady(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });

    await ensureBuyerDeliverablesSectionExpanded(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID);
    await expect(page.getByTestId("buyer-deliverables-artifact-tabs")).toBeVisible();

    const executivePanel = page.getByTestId("buyer-deliverables-panel-sponsor");
    const executiveRegion = executivePanel.getByRole("region", { name: "Deliverables grouped by audience" });

    await expect(executiveRegion).toBeVisible();
    await expect(executiveRegion.getByRole("columnheader", { name: "Output" })).toBeVisible();

    await page.getByRole("tab", { name: "Architecture review board artifacts" }).click();

    const arbPanel = page.getByTestId("buyer-deliverables-panel-arb");

    await expect(arbPanel).toBeVisible({ timeout: 15_000 });

    // Product Tour packages may only ship sponsor/sponsor outputs — empty ARB copy is valid.
    const arbRegion = arbPanel.getByRole("region", { name: "Deliverables grouped by audience" });
    const arbEmpty = arbPanel.getByText(
      /No architecture review board or audit-scoped outputs are listed for this review/i,
    );

    await expect(arbRegion.or(arbEmpty).first()).toBeVisible({ timeout: 15_000 });

    if ((await arbRegion.count()) > 0 && (await arbRegion.isVisible())) {
      await expect(arbRegion.getByRole("columnheader", { name: "Output" })).toBeVisible();
    }
  });
});
