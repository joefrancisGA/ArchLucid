import { expect, test } from "@playwright/test";

import {
  mockArchlucidApiBaseUrl,
  OPERATOR_DEMO_REVIEW_RUN_ID,
  operatorDemoReviewApiResponse,
} from "./fixtures/operator-demo-review-run";

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
      redirectTo: `/reviews/${OPERATOR_DEMO_REVIEW_RUN_ID}`,
    });

    await page.goto(`/reviews/${encodeURIComponent(OPERATOR_DEMO_REVIEW_RUN_ID)}`);

    const reviewDetail = page.getByTestId("review-detail-root");
    await expect(reviewDetail.getByTestId("review-detail-policy-pack-impact-callout")).toBeVisible({ timeout: 15_000 });

    const quickDecisionSummary = page.getByTestId("quick-decision-summary");
    await expect(quickDecisionSummary).toBeVisible({ timeout: 60_000 });
    await quickDecisionSummary.scrollIntoViewIfNeeded();

    await expect(page.getByTestId("quick-decision-policy-violations")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("finding-policy-rule-badge").first()).toBeVisible({ timeout: 30_000 });

    const findingLinks = quickDecisionSummary.locator('[data-testid^="finding-policy-rule-badge"]');
    await expect(findingLinks).toHaveCount(6, { timeout: 30_000 });
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
