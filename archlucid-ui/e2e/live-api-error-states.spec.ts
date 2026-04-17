/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Run: npx playwright test
 */
import { expect, test } from "@playwright/test";

import { liveApiBase } from "./helpers/live-api-client";

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

    await expect(page.getByRole("heading", { name: "Run detail", level: 2 })).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(/Unhandled Runtime Error/i)).toHaveCount(0);

    const problemOrNotFound = page.getByText(/not found|could not be loaded|problem|failed request/i);

    await expect(problemOrNotFound.first()).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole("link", { name: /back to runs/i })).toBeVisible();
  });

  test("runs list page renders without error alerts (empty list is ok)", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/runs?projectId=default");

    await expect(page.getByRole("heading", { name: /runs/i }).first()).toBeVisible({ timeout: 30_000 });

    await expect(page.locator('[role="alert"]').filter({ hasText: /problem|error|failed/i })).toHaveCount(0, {
      timeout: 15_000,
    });

    await expect(page.getByRole("link", { name: /ArchLucid|go to operator home/i }).first()).toBeVisible();
  });

  test("audit search with non-existent run id shows no-results, not a crash", async ({ page }) => {
    test.setTimeout(60_000);

    const fakeRunId = crypto.randomUUID();

    await page.goto("/audit");

    await expect(page.getByRole("heading", { name: /audit log/i })).toBeVisible({ timeout: 30_000 });

    await page.getByLabel(/run id/i).fill(fakeRunId);
    await page.getByRole("button", { name: /^Search$/i }).click();

    await expect(page.getByText(/No audit events match your filters/i)).toBeVisible({ timeout: 60_000 });

    await expect(page.locator('[role="alert"]').filter({ hasText: /problem|error|failed/i })).toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test("governance dashboard loads without uncaught errors", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/governance/dashboard");

    await expect(page.getByRole("heading", { name: /governance dashboard/i })).toBeVisible({ timeout: 60_000 });

    await expect(page.getByText(/Unhandled Runtime Error/i)).toHaveCount(0);
  });
});
