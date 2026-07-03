/**
 * Core Pilot path (product definition in `src/lib/core-pilot-steps.ts`):
 * upload context → create request → track on list → finalized package on review detail → manifest roundtrip.
 *
 * Mock CI uses buyer-polished demo shell (`NEXT_PUBLIC_DEMO_MODE`). Navigation uses home hints and direct
 * routes — not sidebar "Show more" expansion.
 */
import { expect, test } from "@playwright/test";

import {
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
  SHOWCASE_DEMO_RUN_ID,
} from "../e2e/fixtures";
import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "../e2e/fixtures/runs-list-heading";
import {
  BUYER_GOLDEN_PATH_HREFS,
  BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN,
  showcaseSignedManifestBrowserUrlPattern,
} from "../e2e/helpers/buyer-golden-path";
import { outcomeStripSignedRecordLink } from "../e2e/helpers/operator-journey";

const SHOWCASE_RUN_URL_PATTERN = new RegExp(`/(?:reviews|runs)/${SHOWCASE_DEMO_RUN_ID.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`);

test.describe("Core pilot path (mock API, buyer-polished shell)", () => {
  test("home hint, new request, reviews list, finalized review package, manifest roundtrip", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    await expect(page.getByTestId("operator-home-hero-section")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("pilot-command-center-card")).toBeVisible();
    await expect(page.getByTestId("pilot-next-best-action")).toBeVisible();
    await expect(page.getByTestId("operator-home-advanced-guidance")).toBeVisible({ timeout: 60_000 });

    // Mock Playwright config sets NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED — advanced nav is visible without unlock panel.
    await expect(page.getByTestId("operate-features-unlock-panel")).toHaveCount(0);
    await expect(page.getByTestId("sidebar-group-toggle-operate-analysis")).toBeVisible();
    await expect(page.getByTestId("sidebar-group-toggle-operate-governance")).toBeVisible();

    await page.goto("/reviews/new");
    await expect(page.getByRole("heading", { name: /new architecture review/i, level: 2 })).toBeVisible();

    await page.goto("/reviews?projectId=default");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(page.locator('[data-testid^="runs-row-"]').first()).toBeVisible();

    await page.goto(BUYER_GOLDEN_PATH_HREFS.reviewPackage);

    await expect(page).toHaveURL(SHOWCASE_RUN_URL_PATTERN);
    await expect(
      page.getByRole("heading", { level: 1 }).filter({ hasText: BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN }),
    ).toBeVisible({ timeout: 60_000 });

    const outcomeStrip = page.locator('section[aria-label="Review outcome summary"]');
    const manifestLink = outcomeStripSignedRecordLink(outcomeStrip);

    await expect(outcomeStrip).toBeVisible({ timeout: 60_000 });
    await expect(manifestLink).toBeVisible({ timeout: 60_000 });
    await expect(manifestLink).toContainText(/Finalized/i);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.signedManifestFriendly);

    await expect(page).toHaveURL(showcaseSignedManifestBrowserUrlPattern());
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });

    const reviewLink = page
      .locator('[aria-label="Breadcrumb"]')
      .getByRole("link", { name: /Open review|Claims Intake Modernization Review/i })
      .first();

    await expect(reviewLink).toBeVisible({ timeout: 60_000 });
    await reviewLink.click();
    await expect(page).toHaveURL(SHOWCASE_RUN_URL_PATTERN, { timeout: 60_000 });
    await expect(outcomeStrip).toBeVisible();
  });
});
