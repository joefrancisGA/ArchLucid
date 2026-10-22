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

    await page.goto("/pricing#pricing-quote-request", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });

    const section = page.getByTestId("pricing-quote-request-section");
    await expect(section).toBeVisible({ timeout: 60_000 });

    const submit = section.getByRole("button", { name: /Submit quote request/i });

    // Hash auto-open is client-only; expand manually when the collapsed CTA is still showing.
    if ((await submit.count()) === 0) {
      await section.getByRole("button", { name: /^Request quote$/i }).click();
    }

    await expect(submit).toBeVisible({ timeout: 30_000 });

    await section.getByLabel(/Work email/i).fill(`e2e-quote-ui-${Date.now()}@example.com`);
    await section.getByLabel(/^Company$/i).fill("E2E Quote UI Co");
    // Accessible name includes the helper line under "Message" — match prefix, not exact.
    await section.getByRole("textbox", { name: /^Message/i }).fill("Playwright quote path via UI proxy.");

    const quoteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/proxy/v1/marketing/pricing/quote-request")
        && response.request().method() === "POST",
      { timeout: 60_000 },
    );

    await submit.click();

    const quoteResponse = await quoteResponsePromise;
    const quoteStatus = quoteResponse.status();

    // 204 No Content has no body — Playwright's response.text() throws Protocol error if we read it.
    let quoteBodyPreview = "";

    if (quoteStatus !== 204) {
      try {
        quoteBodyPreview = (await quoteResponse.text()).slice(0, 400);
      } catch {
        quoteBodyPreview = "(body unavailable)";
      }
    }

    expect(quoteStatus, `quote-request proxy status ${quoteStatus}: ${quoteBodyPreview}`).toBe(204);

    await expect(page.getByTestId("pricing-quote-request-confirmation")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("pricing-quote-request-confirmation")).toContainText(
      /Thanks .+ your request was received/i,
    );
  });
});
