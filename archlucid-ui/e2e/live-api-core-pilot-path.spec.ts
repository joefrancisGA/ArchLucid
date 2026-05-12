/**
 * Merge-blocking live operator journey: same four-step pilot spine as `tests/core-pilot-path.spec.ts`,
 * against Sql + DevelopmentBypass API (seeded showcase run). See `e2e/smoke.spec.ts` for showcase IDs.
 */
import { expect, test } from "@playwright/test";

import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN, SHOWCASE_DEMO_RUN_ID } from "./fixtures";
import { liveApiBase } from "./helpers/live-api-client";

test.describe("live-api-core-pilot-path", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("operator home, new request, reviews list, showcase review deliverables", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Architecture reviews" })).toBeVisible();

    await page.goto("/reviews/new");
    await expect(page.getByRole("heading", { name: /new architecture review/i, level: 2 })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/reviews?projectId=default");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
    await expect(page.locator('[data-testid^="runs-row-"]').first()).toBeVisible();

    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Claims Intake Modernization/i,
      }),
    ).toBeVisible();

    const deliverablesRegion = page.getByRole("region", { name: "Deliverables grouped by audience" });
    await expect(deliverablesRegion).toBeVisible();
    await expect(deliverablesRegion.getByRole("columnheader", { name: "Output" })).toHaveCount(2);
  });
});
