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
    const findingsPanel = page.getByTestId("review-detail-workspace-panel-findings");
    const quickDecisionSummary = findingsPanel.getByTestId("quick-decision-summary");
    await expect(quickDecisionSummary).toBeVisible({ timeout: 60_000 });
    await quickDecisionSummary.scrollIntoViewIfNeeded();

    const lowConfidenceToggle = quickDecisionSummary.getByTestId("quick-decision-show-low-confidence");

    if (await lowConfidenceToggle.isVisible().catch(() => false)) {
      await lowConfidenceToggle.check();
    }

    // Findings workspace uses card mode (primary + additional), not the legacy Policy violations list test id.
    const primaryCard = await expandFindingWorkspaceCard(findingsPanel, "demo-finding-1");
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

  test("mock API returns stable demo review payload shape", async ({ request }) => {
    const upstream = await request.post(`${mockArchlucidApiBaseUrl()}/v1/reviews/demo`, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {},
    });

    expect(upstream.ok(), await upstream.text()).toBeTruthy();
    await expect(upstream.json()).resolves.toEqual(operatorDemoReviewApiResponse());
  });
});
