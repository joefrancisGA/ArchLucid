import { expect, test } from "@playwright/test";

import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";
import { OPERATOR_SHELL_PRESET_STORAGE_KEY } from "@/lib/operator-nav-preset";

/**
 * Collapsed pilot sidebar + progressive disclosure tiers (Improvement #13).
 * Requires a full-operator build — run `npx playwright test -c playwright.operator-mock.config.ts`
 * (buyer-polished mock builds omit the “Show all features” control).
 */
test.describe("pilot-default operator navigation profile @pilot-nav", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((presetStorageKey: string) => {
      // Full navigator preset: tier/disclosure toggles are under test; preset pruning would hide operate links.
      localStorage.setItem(presetStorageKey, "full");
      localStorage.setItem("archlucid-nav-expanded", "false");
      localStorage.setItem("archlucid_nav_show_extended", "false");
      localStorage.setItem("archlucid_nav_show_advanced", "false");
      // Collapsed Analysis/Governance groups must not hide extended links from role queries.
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("archlucid_sidebar_group_")) {
          localStorage.removeItem(key);
        }
      }
    }, OPERATOR_SHELL_PRESET_STORAGE_KEY);
  });

  test("pilot profile hides compare and governance until expanded @pilot-nav", async ({ page }) => {
    const meResponse = page.waitForResponse(
      (response) => response.url().includes("/api/proxy/api/auth/me") && response.ok(),
    );

    await page.goto("/");
    await meResponse;

    const reviewNav = page.getByRole("navigation", { name: "Review work" });

    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Governance workflow" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Analysis" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Governance" })).toHaveCount(0);

    const showAllFeatures = page.getByTestId("sidebar-show-all-features-toggle");

    await expect(showAllFeatures).toBeVisible();
    await showAllFeatures.click();

    await expect(page.getByRole("navigation", { name: "Analysis" })).toBeVisible();
    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);

    const layoutDialog = () => page.getByRole("dialog", { name: "Sidebar layout" });

    await page.getByRole("button", { name: "Sidebar layout", exact: true }).click();
    await expect(layoutDialog()).toBeVisible();
    await layoutDialog().getByRole("checkbox", { name: NAV_DISCLOSURE.extended.show }).click();
    // Modal dialog marks the sidebar inert for role queries until it closes.
    await page.keyboard.press("Escape");
    await expect(layoutDialog()).toBeHidden();

    const analysisNav = page.getByRole("navigation", { name: "Analysis" });

    await expect(analysisNav.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");

    // Footer toggle survives cluster re-mount when extended tier unlocks; re-opening Sidebar layout flakes in CI.
    const showAdvancedToggle = page.getByTestId("sidebar-show-advanced-operations-toggle");

    await showAdvancedToggle.scrollIntoViewIfNeeded();
    await showAdvancedToggle.click();

    await page.getByRole("button", { name: "Governance" }).click();

    const governanceNav = page.getByRole("navigation", { name: "Governance" });

    await expect(governanceNav.getByRole("link", { name: "Governance workflow" })).toHaveAttribute(
      "href",
      "/governance",
    );
  });
});
