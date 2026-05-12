import { expect, test } from "@playwright/test";

import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "../e2e/fixtures/runs-list-heading";
import { SHOWCASE_DEMO_RUN_ID } from "../e2e/fixtures/ids";

/**
 * Core Pilot path (product definition in `src/lib/core-pilot-steps.ts`):
 * create request → track on list → finalized package on review detail → read deliverables.
 *
 * Mock CI uses buyer-polished demo shell (`NEXT_PUBLIC_DEMO_MODE`); home surfaces
 * {@link CorePilotBuyerStepHint} instead of {@link OperatorFirstRunWorkflowPanel}.
 */
test.describe("Core pilot path (mock API, buyer-polished shell)", () => {
  test("home pilot hint, new request, reviews list, finalized review package with deliverables", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    await expect(page.getByTestId("core-pilot-buyer-step-hint")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("core-pilot-buyer-step-badge")).toHaveText("Step 4 of 4");

    await expect(page.getByRole("region", { name: "Recommended review journey" })).toBeVisible();

    await page.goto("/reviews/new");
    await expect(page.getByRole("heading", { name: /new architecture review/i, level: 2 })).toBeVisible();

    await page.goto("/reviews?projectId=default");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(page.locator('[data-testid^="runs-row-"]').first()).toBeVisible();

    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Claims Intake Modernization/i,
      }),
    ).toBeVisible();

    const outcomeStrip = page.locator('section[aria-label="Review outcome summary"]');
    await expect(outcomeStrip.getByRole("link", { name: /Finalized/i })).toBeVisible();

    const deliverablesRegion = page.getByRole("region", { name: "Deliverables grouped by audience" });
    await expect(deliverablesRegion).toBeVisible();
    await expect(deliverablesRegion.getByRole("columnheader", { name: "Output" })).toHaveCount(2);
  });
});
