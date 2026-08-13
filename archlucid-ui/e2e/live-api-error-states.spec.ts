/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Run: npx playwright test
 */
import { expect, test } from "@playwright/test";

import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "./fixtures";
import { SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/sponsor-dashboard-route";
import { liveApiBase } from "./helpers/live-api-client";
import { auditPageMainHeading, clickAuditSearchAndWaitForSuccessfulResponse, expandAuditBuyerFiltersIfPresent, expectAuditSearchNoResults } from "./helpers/operator-journey";

test.describe("live-api-error-states", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("run detail shows problem UI for non-existent run id", async ({ page }) => {
    test.setTimeout(60_000);

    const fakeRunId = crypto.randomUUID();

    await page.goto(`/runs/${fakeRunId}`);

    // A genuinely-missing runId resolves to `{ kind: "not-found", reason: "missing" }` in
    // load-run-detail-page-model.ts, which renders the branded `OperatorBrandedNotFound` empty
    // state (no page heading — title is a `role="status"` `<strong>`, not a heading role) instead
    // of the older RunDetailPageFetchErrorView "Review detail" h1, which is reserved for
    // `fromGeneration` / workspace-mismatch and transient fetch-error cases.
    await expect(page.getByTestId("branded-not-found")).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(/Unhandled Runtime Error/i)).toHaveCount(0);

    const problemOrNotFound = page.getByText(/not found|could not be loaded|problem|failed request/i);

    await expect(problemOrNotFound.first()).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId("not-found-review-packages")).toBeVisible();
  });

  test("runs list page renders without error alerts (empty list is ok)", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/runs?projectId=default");

    // "/runs" permanently redirects to "/architecture/reviews" (next.config.ts) and the list page's heading was
    // renamed to RUNS_LIST_PAGE_TITLES ("Review Packages") as part of the runs → reviews vocabulary
    // consolidation — it no longer contains the literal substring "runs".
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.locator('[role="alert"]').filter({ hasText: /problem|error|failed/i })).toHaveCount(0, {
      timeout: 15_000,
    });

    await expect(page.getByRole("link", { name: /ArchLucid|go to overview/i }).first()).toBeVisible();
  });

  test("audit search with non-existent run id shows no-results, not a crash", async ({ page }) => {
    test.setTimeout(120_000);

    const fakeRunId = crypto.randomUUID();

    // Pin scope in the URL so buyer-polished auto-prime does not replace the review id with the showcase run.
    await page.goto(`/governance/audit?runId=${encodeURIComponent(fakeRunId)}`, { waitUntil: "domcontentloaded" });

    await expect(auditPageMainHeading(page)).toBeVisible({ timeout: 60_000 });

    await expandAuditBuyerFiltersIfPresent(page);

    const reviewIdInput = page.getByTestId("audit-review-id-input");

    await expect(reviewIdInput).toBeVisible({ timeout: 120_000 });
    await reviewIdInput.fill("");
    await reviewIdInput.fill(fakeRunId);

    await clickAuditSearchAndWaitForSuccessfulResponse(page, { runId: fakeRunId, timeoutMs: 90_000 });

    await expectAuditSearchNoResults(page, { timeoutMs: 60_000 });

    await expect(page.locator('[role="alert"]').filter({ hasText: /problem|error|failed/i })).toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test("sponsor dashboard workspace health loads without uncaught errors", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF);

    // Heading copy was rebranded to "Sponsor Workspace Health" (full operator) / "Workspace
    // overview" (buyer-polished) in SponsorWorkspaceHealthDashboard.tsx — "Governance dashboard"
    // is no longer rendered anywhere on this route. NOTE: the heading only renders once the
    // dashboard reaches its "ready" state; the loading/error states render `LayerHeader` guidance
    // text only (no heading role), so this assertion still depends on Concern F's fix for the
    // GET /v1/governance/compliance-drift-trend 503 (out of scope here).
    await expect(
      page.getByRole("heading", { name: /sponsor workspace health|workspace overview/i }),
    ).toBeVisible({ timeout: 60_000 });

    await expect(page.getByText(/Unhandled Runtime Error/i)).toHaveCount(0);
  });
});
