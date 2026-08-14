/**
 * Mock E2E uses buyer-polished shell by default (`playwright.mock.config.ts` → `NEXT_PUBLIC_DEMO_MODE`).
 * API data comes from the loopback mock server (`e2e/mock-archlucid-api-server.ts`) — avoid overlapping `page.route`
 * handlers here; they can interfere with App Router client navigations.
 */
import { expect, test } from "@playwright/test";

import {
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
  SHOWCASE_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import {
  showcaseSignedManifestBrowserUrlPattern,
  BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN,
  expectBuyerGoldenPageReady,
} from "./helpers/buyer-golden-path";
import { waitForAppReady } from "./helpers/waits";
import {
  expandReviewDetailOutcomeCards,
  openReviewDetailWorkspaceTab,
  openVisibleReviewOutcomeSummaryStrip,
  outcomeStripSignedRecordLink,
} from "./helpers/operator-journey";

const SHOWCASE_RUN_DETAIL_HEADING = BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN;

test.describe("operator journey — run detail to manifest and back", () => {
  test("reviews showcase run, opens manifest, returns to run (mock API only)", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await expect(page).toHaveURL(new RegExp(`/(?:reviews|runs)/${SHOWCASE_DEMO_RUN_ID.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`));

    await waitForAppReady(page);
    await expectBuyerGoldenPageReady(page);

    await expect(
      getAppMain(page).getByRole("heading", { level: 1 }).filter({ hasText: SHOWCASE_RUN_DETAIL_HEADING }),
    ).toBeVisible({ timeout: 60_000 });

    const outcomeStrip = await openVisibleReviewOutcomeSummaryStrip(page, SHOWCASE_DEMO_RUN_ID);

    const manifestLink = outcomeStripSignedRecordLink(outcomeStrip);
    const manifestHref = `/governance/signed-records/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`;

    await expect(manifestLink).toBeVisible({ timeout: 60_000 });
    await expect(manifestLink).toContainText(/Finalized/i);
    await expect(manifestLink).toHaveAttribute("href", manifestHref);

    // Buyer-polished shell may canonicalize `/manifests/{uuid}` → `/architecture/reviews/{runId}/manifest` after navigation.
    await page.goto(manifestHref);

    await expect(page).toHaveURL(showcaseSignedManifestBrowserUrlPattern(), { timeout: 60_000 });
    await expect(page.getByText(/Fetching manifest summary/i)).toHaveCount(0, { timeout: 60_000 });
    await expect(
      getAppMain(page).getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });

    const reviewLink = page.getByTestId("manifest-detail-back-to-review");

    await expect(reviewLink).toBeVisible({ timeout: 60_000 });
    await expect(reviewLink).toHaveAttribute("href", `/architecture/reviews/${SHOWCASE_DEMO_RUN_ID}`);

    // Full navigation is more reliable than client nav on cold CI agents (RSC + loading.tsx).
    await page.goto(`/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    await expect(page).toHaveURL(new RegExp(`/(?:reviews|runs)/${SHOWCASE_DEMO_RUN_ID.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`), {
      timeout: 60_000,
    });

    await expectBuyerGoldenPageReady(page);

    await expect(
      getAppMain(page).getByRole("heading", { level: 1 }).filter({ hasText: SHOWCASE_RUN_DETAIL_HEADING }),
    ).toBeVisible({ timeout: 60_000 });

    await openReviewDetailWorkspaceTab(page, SHOWCASE_DEMO_RUN_ID, "overview");
    await expandReviewDetailOutcomeCards(page);
    await expect(
      page.locator(
        'section[aria-label="Review outcome summary"], section[aria-label="Review status summary"]',
      ),
    ).toBeVisible({ timeout: 60_000 });
  });
});
