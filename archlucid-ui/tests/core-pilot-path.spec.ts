/**
 * Core Pilot path (product definition in `src/lib/core-pilot-steps.ts`):
 * upload context → create request → track on list → finalized package on review detail → manifest roundtrip.
 *
 * Mock CI uses buyer-polished demo shell (`NEXT_PUBLIC_DEMO_MODE`). Navigation uses home hints and direct
 * routes — not sidebar "Show more" expansion.
 */
import { expect, test } from "@playwright/test";

import {
  START_REVIEW_PAGE_HEADING_PATTERN,
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
  SHOWCASE_DEMO_RUN_ID,
} from "../e2e/fixtures";
import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "../e2e/fixtures/runs-list-heading";
import {
  BUYER_GOLDEN_PATH_HREFS,
  BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN,
  expectBuyerGoldenPageReady,
  showcaseSignedManifestBrowserUrlPattern,
} from "../e2e/helpers/buyer-golden-path";
import { getAppMain } from "../e2e/helpers/app-main";
import { reviewsHubFirstPackageRow } from "../e2e/helpers/reviews-hub";
import {
  openVisibleReviewOutcomeSummaryStrip,
  outcomeStripSignedRecordLink,
} from "../e2e/helpers/operator-journey";
import { waitForAppReady } from "../e2e/helpers/waits";

const SHOWCASE_RUN_URL_PATTERN = new RegExp(`/(?:reviews|runs)/${SHOWCASE_DEMO_RUN_ID.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`);

test.describe("Core pilot path (mock API, buyer-polished shell)", () => {
  test("home hint, new request, reviews list, finalized review, manifest roundtrip", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    await expect(page.getByTestId("operator-home-hero-section")).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByTestId("operator-home-hero-section").getByTestId("pilot-command-center-card"),
    ).toBeVisible();
    await expect(page.getByTestId("pilot-next-best-action")).toBeVisible();
    // Buyer-polished Overview omits the collapsed advanced-guidance rail (hero contextual help covers onboarding).
    await expect(page.getByTestId("operator-home-advanced-guidance")).toHaveCount(0);

    // Mock Playwright config sets NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED — full nav (incl. governance) without unlock / density collapse.
    await expect(page.getByTestId("operate-features-unlock-panel")).toHaveCount(0);
    await expect(page.getByTestId("sidebar-group-toggle-operate-analysis")).toBeVisible();
    await expect(page.getByTestId("sidebar-group-toggle-operate-governance")).toBeVisible();

    await page.goto("/architecture/reviews/new");
    await expect(
      page.getByRole("heading", { name: START_REVIEW_PAGE_HEADING_PATTERN, level: 1 }),
    ).toBeVisible();

    await page.goto("/architecture/reviews");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(reviewsHubFirstPackageRow(page.getByRole("main"))).toBeVisible();

    await page.goto(BUYER_GOLDEN_PATH_HREFS.reviewPackage);

    await expect(page).toHaveURL(SHOWCASE_RUN_URL_PATTERN);
    await waitForAppReady(page);
    await expectBuyerGoldenPageReady(page);
    await expect(
      getAppMain(page).getByRole("heading", { level: 1 }).filter({ hasText: BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN }),
    ).toBeVisible({ timeout: 60_000 });

    const outcomeStrip = await openVisibleReviewOutcomeSummaryStrip(page, SHOWCASE_DEMO_RUN_ID);
    const manifestLink = outcomeStripSignedRecordLink(outcomeStrip);

    await expect(manifestLink).toBeVisible({ timeout: 60_000 });
    await expect(manifestLink).toContainText(/Finalized/i);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.signedManifestCanonical);

    await expect(page).toHaveURL(showcaseSignedManifestBrowserUrlPattern());
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });

    const reviewLink = page.getByTestId("manifest-detail-back-to-review");

    await expect(reviewLink).toBeVisible({ timeout: 60_000 });
    await reviewLink.click();
    await expect(page).toHaveURL(SHOWCASE_RUN_URL_PATTERN, { timeout: 60_000 });
    await openVisibleReviewOutcomeSummaryStrip(page, SHOWCASE_DEMO_RUN_ID);
  });
});
