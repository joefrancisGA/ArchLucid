import { expect, test } from "@playwright/test";

import {
  mockArchlucidApiBaseUrl,
  OPERATOR_DEMO_REVIEW_RUN_ID,
  operatorDemoReviewApiResponse,
} from "./fixtures/operator-demo-review-run";
import { expandFindingWorkspaceCard, openReviewDetailWorkspaceTab } from "./helpers/operator-journey";
import { waitForAppReady } from "./helpers/waits";

/**
 * Reliability guard for the one-click demo review path (assessment Tier 2 #7).
 * Run: `npx playwright test -c playwright.mock.config.ts e2e/demo-review-one-click.spec.ts`
 */
test.describe("demo review one-click reliability @demo-review", () => {
  test("POST demo review lands on review detail with policy callout and findings", async ({ page, request }) => {
    test.setTimeout(60_000);

    const demoResponse = await request.post("/api/run-demo-review", {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {},
    });

    expect(demoResponse.ok(), await demoResponse.text()).toBeTruthy();

    const body: unknown = await demoResponse.json();
    expect(body).toMatchObject({
      runId: OPERATOR_DEMO_REVIEW_RUN_ID,
      redirectTo: `/architecture/reviews/${OPERATOR_DEMO_REVIEW_RUN_ID}`,
    });

    await page.goto(`/architecture/reviews/${encodeURIComponent(OPERATOR_DEMO_REVIEW_RUN_ID)}`);
    await waitForAppReady(page);

    const reviewDetail = page.getByTestId("review-detail-root");
    await openReviewDetailWorkspaceTab(page, OPERATOR_DEMO_REVIEW_RUN_ID, "policies");
    await expect(reviewDetail.getByTestId("review-detail-policy-pack-impact-callout")).toBeVisible({
      timeout: 60_000,
    });

    await openReviewDetailWorkspaceTab(page, OPERATOR_DEMO_REVIEW_RUN_ID, "findings");
    const quickDecisionSummary = page.getByTestId("quick-decision-summary");
    await expect(quickDecisionSummary).toBeVisible({ timeout: 60_000 });
    await quickDecisionSummary.scrollIntoViewIfNeeded();

    // Findings workspace uses card mode (primary + additional), not the legacy Policy violations list test id.
    const primaryCard = await expandFindingWorkspaceCard(quickDecisionSummary, "demo-finding-1");
    await expect(primaryCard).toHaveAttribute("data-finding-workspace-primary", "true");
    await expect(
      primaryCard.getByRole("heading", { level: 3, name: "Public SQL endpoint without private link" }),
    ).toBeVisible({ timeout: 30_000 });

    await expect(quickDecisionSummary.getByTestId("finding-workspace-card-demo-finding-2")).toBeVisible({
      timeout: 30_000,
    });
    await expect(quickDecisionSummary.getByTestId("finding-workspace-card-demo-finding-3")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("desktop review tabs retain Sponsor packet navigation", async ({ page, request }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const demoResponse = await request.post("/api/run-demo-review", {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {},
    });
    expect(demoResponse.ok(), await demoResponse.text()).toBeTruthy();

    const reviewPath = `/architecture/reviews/${encodeURIComponent(OPERATOR_DEMO_REVIEW_RUN_ID)}`;
    await page.goto(`${reviewPath}?reviewTab=overview`);
    await waitForAppReady(page);

    const reviewDetail = page.getByTestId("review-detail-root");
    const tabStrip = reviewDetail.getByTestId("review-detail-workspace-tabs");
    await expect(tabStrip).toBeVisible({ timeout: 60_000 });
    await expect(reviewDetail.getByTestId("review-detail-workspace-sections-select")).toBeHidden();

    // Independent contract: do not derive the expected ids from the production tab list.
    const expectedTabIds = [
      "overview", "findings", "evidence", "policies", "decisions-remediation",
      "review-package", "architecture", "activity",
    ] as const;
    await expect(tabStrip.getByRole("tab")).toHaveCount(expectedTabIds.length);
    for (const tabId of expectedTabIds) {
      const trigger = tabStrip.getByTestId(`review-detail-workspace-tab-${tabId}`);
      await expect(trigger).toBeVisible();
      await expect(trigger).toBeEnabled();
    }

    const overview = tabStrip.getByTestId("review-detail-workspace-tab-overview");
    const overviewPanel = reviewDetail.getByTestId("review-detail-workspace-panel-overview");
    const sponsor = tabStrip.getByTestId("review-detail-workspace-tab-review-package");
    const sponsorPanel = reviewDetail.getByTestId("review-detail-workspace-panel-review-package");
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await expect(overviewPanel).toBeVisible();
    await expect(sponsor).toHaveAccessibleName(/^Sponsor packet(?:\s|$)/u);
    await expect(sponsor).toContainText("Sponsor packet");
    await expect(sponsor).not.toContainText("Finalized review record");
    await expect(sponsor).toHaveAttribute("aria-selected", "false");
    await expect(sponsorPanel).toBeHidden();

    // Do not use the navigation helper here: its deep-link fallback can mask a broken click.
    await sponsor.click();
    await expect(page).toHaveURL((url) =>
      url.pathname.endsWith(`/reviews/${encodeURIComponent(OPERATOR_DEMO_REVIEW_RUN_ID)}`)
      && url.searchParams.get("reviewTab") === "review-package",
    );
    await expect(sponsor).toHaveAttribute("aria-selected", "true");
    await expect(sponsor).toHaveAttribute("data-state", "active");
    await expect(sponsorPanel).toBeVisible({ timeout: 60_000 });
    await expect(overview).toHaveAttribute("aria-selected", "false");
    await expect(overviewPanel).toBeHidden();

    // A bookmarked/reloaded legacy review-package URL must still select the renamed tab.
    await page.reload();
    await waitForAppReady(page);
    await expect(sponsor).toHaveAttribute("aria-selected", "true", { timeout: 60_000 });
    await expect(sponsorPanel).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL((url) =>
      url.pathname.endsWith(`/reviews/${encodeURIComponent(OPERATOR_DEMO_REVIEW_RUN_ID)}`)
      && url.searchParams.get("reviewTab") === "review-package",
    );
  });

  test("mock API returns stable demo review payload shape", async ({ request }) => {
    const upstream = await request.post(`${mockArchlucidApiBaseUrl()}/v1/reviews/demo`, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {},
    });

    expect(upstream.ok(), await upstream.text()).toBeTruthy();
    await expect(upstream.json()).resolves.toEqual(operatorDemoReviewApiResponse());
  });
});
