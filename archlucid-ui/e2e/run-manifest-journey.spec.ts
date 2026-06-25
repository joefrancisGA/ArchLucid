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
import { showcaseSignedManifestBrowserUrlPattern } from "./helpers/buyer-golden-path";

const SHOWCASE_RUN_DETAIL_HEADING = /Claims Intake Modernization/i;

test.describe("operator journey — run detail to manifest and back", () => {
  test("reviews showcase run, opens manifest, returns to run (mock API only)", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await expect(page).toHaveURL(new RegExp(`/(?:reviews|runs)/${SHOWCASE_DEMO_RUN_ID.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`));

    await expect(
      page.getByRole("heading", { level: 1, name: SHOWCASE_RUN_DETAIL_HEADING }),
    ).toBeVisible({ timeout: 60_000 });

    const outcomeStrip = page.locator('section[aria-label="Review outcome summary"]');

    await expect(outcomeStrip).toBeVisible({ timeout: 60_000 });

    const manifestLink = outcomeStrip.locator('a[href^="/manifests/"]').first();
    const manifestHref = `/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`;

    await expect(manifestLink).toBeVisible({ timeout: 60_000 });
    await expect(manifestLink).toContainText(/Finalized/i);
    await expect(manifestLink).toHaveAttribute("href", manifestHref);

    // Buyer-polished shell may canonicalize `/manifests/{uuid}` → `/reviews/{runId}/manifest` after navigation.
    await page.goto(manifestHref);

    await expect(page).toHaveURL(showcaseSignedManifestBrowserUrlPattern(), { timeout: 60_000 });
    await expect(page.getByText(/Fetching manifest summary/i)).toHaveCount(0, { timeout: 60_000 });
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });

    const reviewLink = page
      .locator('[aria-label="Breadcrumb"]')
      .getByRole("link", { name: /Open review|Claims Intake Modernization Review/i })
      .first();

    await expect(reviewLink).toBeVisible({ timeout: 60_000 });
    await reviewLink.click();
    await expect(page).toHaveURL(new RegExp(`/(?:reviews|runs)/${SHOWCASE_DEMO_RUN_ID.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`), {
      timeout: 60_000,
    });

    await expect(
      page.getByRole("heading", { level: 1, name: SHOWCASE_RUN_DETAIL_HEADING }),
    ).toBeVisible({ timeout: 60_000 });

    await expect(outcomeStrip).toBeVisible();
  });
});
