import { expect, test } from "@playwright/test";

import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";

/**
 * Pilot-default operator navigation profile (Improvement #13).
 * Run: `npx playwright test -c playwright.mock.config.ts e2e/pilot-nav-profile.spec.ts`
 */
test.describe("pilot-default operator navigation profile @pilot-nav", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("archlucid-nav-preset-id", "pilot_operator");
      localStorage.removeItem("archlucid-nav-expanded");
      localStorage.setItem("archlucid_nav_show_extended", "false");
      localStorage.setItem("archlucid_nav_show_advanced", "false");
    });
  });

  test("pilot profile hides compare and governance until expanded @pilot-nav", async ({ page }) => {
    await page.goto("/");

    const reviewNav = page.getByRole("navigation", { name: "Review work" });

    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Governance workflow" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Analysis" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Governance" })).toHaveCount(0);

    await page.getByRole("button", { name: /Show all features/i }).click();

    await expect(page.getByRole("navigation", { name: "Analysis" })).toBeVisible();
    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);

    await page.getByRole("button", { name: "Sidebar layout" }).click();
    await page.getByRole("checkbox", { name: NAV_DISCLOSURE.extended.show }).check();
    await page.getByRole("button", { name: "Close dialog" }).click();

    await expect(page.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");

    await page.getByRole("button", { name: "Sidebar layout" }).click();
    await page.getByRole("checkbox", { name: NAV_DISCLOSURE.advanced.show }).check();
    await page.getByRole("button", { name: "Close dialog" }).click();

    await page.getByRole("button", { name: "Governance" }).click();

    const governanceNav = page.getByRole("navigation", { name: "Governance" });

    await expect(governanceNav.getByRole("link", { name: "Governance workflow" })).toHaveAttribute(
      "href",
      "/governance",
    );
  });
});
