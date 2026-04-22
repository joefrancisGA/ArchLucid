/**
 * Live API + UI: anonymous marketing quote path (`POST /v1/marketing/pricing/quote-request`) and
 * the `/pricing` form via same-origin proxy.
 */
import { expect, test } from "@playwright/test";

import { liveApiBase } from "./helpers/live-api-client";

test.describe("live-api-marketing-pricing-quote", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("POST /v1/marketing/pricing/quote-request returns 204 for valid body", async ({ request }) => {
    const res = await request.post(`${liveApiBase}/v1/marketing/pricing/quote-request`, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {
        workEmail: `e2e-quote-api-${Date.now()}@example.com`,
        companyName: "E2E Quote API Co",
        tierInterest: "Professional",
        message: "Procurement pricing request (Playwright live API).",
        websiteUrl: "",
      },
      timeout: 60_000,
    });

    expect(res.status()).toBe(204);
  });

  test("pricing page submit shows confirmation", async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto("/pricing", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });

    await page.getByLabel(/Work email/i).fill(`e2e-quote-ui-${Date.now()}@example.com`);
    await page.getByLabel(/^Company$/i).fill("E2E Quote UI Co");
    await page.getByLabel(/Message/i).fill("Playwright quote path via UI proxy.");

    await page.getByRole("button", { name: /Submit quote request/i }).click();

    await expect(page.getByText("Thanks — your request was received.")).toBeVisible({ timeout: 60_000 });
  });
});
