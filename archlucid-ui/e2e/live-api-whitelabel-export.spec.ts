/**
 * Requires ArchLucid.Api + SQL (DevelopmentBypass in default CI live lane).
 *
 * Canonical seeded showcase review → Deliverables → firm-branded consulting DOCX modal → POST consulting export + download.
 */
import path from "node:path";

import { expect, test } from "@playwright/test";

import { SHOWCASE_DEMO_RUN_ID } from "./fixtures";
import { liveApiBase } from "./helpers/live-api-client";

test.describe("live-api-whitelabel-export", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("finalized showcase review: whitelabel consulting export modal fills packaging fields and downloads DOCX", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);

    await expect(page.getByText(/Loading review detail/i)).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    await page.locator("#artifacts-exports").scrollIntoViewIfNeeded();

    const openModal = page.getByTestId("open-whitelabel-consulting-export");

    await expect(openModal).toBeVisible({ timeout: 60_000 });

    await openModal.click();

    await expect(page.getByTestId("whitelabel-export-modal")).toBeVisible();

    await page.getByTestId("whitelabel-firm-display-name").fill("E2E Firm QA");

    await page.getByTestId("whitelabel-client-engagement-title").fill("E2E Engagement — packaging smoke");

    const logoFixturePath = path.join(process.cwd(), "public", "logo", "icon-192.png");

    await page.getByTestId("whitelabel-logo-file").setInputFiles(logoFixturePath);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes("/analysis-report/export/docx/consulting") &&
          response.ok(),
        { timeout: 120_000 },
      ),
      page.getByTestId("whitelabel-consulting-export-submit").click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.docx$/i);
  });
});
