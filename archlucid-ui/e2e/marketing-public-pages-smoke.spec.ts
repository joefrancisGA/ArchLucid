/**
 * Lightweight sponsor-visible marketing smoke — headings render without operator shell auth.
 * Keeps `/welcome`, `/why`, and `/trust` from regressing to generic errors during demo UX churn.
 */
import { expect, test } from "@playwright/test";

test.describe.parallel("marketing public pages smoke @marketing-public-smoke", () => {
  test("welcome, why, and trust surfaces render primary hero headings", async ({ page }) => {
    await page.goto("/welcome", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Defensible architecture, on demand/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    await page.goto("/why", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /^Why ArchLucid$/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    await page.goto("/trust", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "Trust Center", level: 1 })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);
  });

  test("welcome hero — three CTAs, self-demo navigation, early access thanks (mocked POST)", async ({ page }) => {
    await page.goto("/welcome", { waitUntil: "load" });

    await expect(page.getByRole("link", { name: /request walkthrough/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /try the self-demo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /join early access/i })).toBeVisible();

    await page.getByRole("link", { name: /try the self-demo/i }).click();
    await page.waitForURL(/\/(runs|reviews)\/[^/]+/i, { timeout: 60_000 });

    await page.goto("/welcome", { waitUntil: "load" });

    await page.route("**/api/proxy/v1/marketing/early-access", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 204 });
        return;
      }

      await route.continue();
    });

    await page.getByRole("button", { name: /join early access/i }).click();
    await page.getByRole("textbox", { name: /work email/i }).fill("playwright-welcome@example.com");
    await page.getByRole("button", { name: /^submit$/i }).click();
    await expect(page.getByTestId("welcome-early-access-thanks")).toBeVisible({ timeout: 30_000 });
  });
});
