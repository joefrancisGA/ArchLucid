/**
 * Lightweight sponsor-visible marketing smoke — headings render without operator shell auth.
 * Keeps `/welcome`, `/why`, and `/trust` from regressing to generic errors during demo UX churn.
 */
import { expect, test } from "@playwright/test";

test.describe.parallel("marketing public pages smoke @marketing-public-smoke", () => {
  test("welcome, why, and trust surfaces render primary hero headings", async ({ page }) => {
    await page.goto("/welcome", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Ship governed architecture decisions faster/i })).toBeVisible({
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
});
