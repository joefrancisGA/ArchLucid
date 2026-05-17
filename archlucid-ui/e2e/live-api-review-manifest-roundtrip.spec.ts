/**
 * Requires ArchLucid.Api + SQL (DevelopmentBypass in default CI live lane).
 *
 * Parity with mock `run-manifest-journey.spec.ts`: canonical showcase review → outcome **Finalized** manifest deep link
 * → manifest detail → breadcrumb link back to the review (live proxy rather than `/api/proxy` mock).
 */
import { expect, test } from "@playwright/test";

import { MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN, SHOWCASE_DEMO_RUN_ID } from "./fixtures";
import { liveApiBase } from "./helpers/live-api-client";

/** Breadcrumb label varies with buyer-polished shell vs full-operator manifest layout. */
const NAV_BACK_TO_REVIEW_FROM_MANIFEST = /^Open review$|^Claims Intake Modernization Review$/;

test.describe("live-api-review-manifest-roundtrip", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("canonical showcase: outcome finalized link → manifest → breadcrumb back to review", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await expect(page.getByText(/Loading review detail/i)).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    const outcomeStrip = page.locator('section[aria-label="Review outcome summary"]');

    await expect(outcomeStrip).toBeVisible({ timeout: 60_000 });

    const manifestLink = outcomeStrip.locator(`a[href^="/manifests/"]`).first();

    await expect(manifestLink).toBeVisible({ timeout: 60_000 });
    await expect(manifestLink).toContainText(/Finalized/i);

    await Promise.all([
      page.waitForURL(/\/manifests\/.+/i, { waitUntil: "commit" }),
      manifestLink.click(),
    ]);

    const manifestMain = page.locator("main");

    await expect(manifestMain.getByText(/Fetching manifest summary/i)).toHaveCount(0, {
      timeout: 60_000,
    });

    await expect(page.getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN })).toBeVisible({
      timeout: 60_000,
    });

    const reviewLink = page
      .locator('[aria-label="Breadcrumb"]')
      .getByRole("link", { name: NAV_BACK_TO_REVIEW_FROM_MANIFEST });

    await expect(reviewLink).toBeVisible({ timeout: 30_000 });

    await Promise.all([
      page.waitForURL(/\/reviews\/.+/i, { waitUntil: "commit" }),
      reviewLink.click(),
    ]);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Claims Intake Modernization/i,
      }),
    ).toBeVisible({ timeout: 60_000 });
  });
});
