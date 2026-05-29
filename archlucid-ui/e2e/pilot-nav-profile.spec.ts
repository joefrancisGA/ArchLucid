import { expect, test, type Page } from "@playwright/test";

import { ONBOARDING_TOUR_COMPLETED_KEY } from "@/lib/onboarding-tour";
import { OPERATOR_SHELL_PRESET_STORAGE_KEY } from "@/lib/operator-nav-preset";
import { HAS_SEEN_ONBOARDING_STORAGE_KEY } from "@/lib/operator-welcome-onboarding-storage";

/** Footer disclosure controls sit in the scrollable operator sidebar — scroll before click to avoid CI flake. */
async function scrollOperatorSidebarFooterIntoView(page: Page): Promise<void> {
  const sidebarNav = page.getByTestId("sidebar-nav");

  await expect(sidebarNav).toBeVisible();
  await sidebarNav.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
}

/** WelcomeModal (Radix Dialog overlay) and the home onboarding tour block sidebar pointer events in mock E2E. */
async function dismissBlockingHomeModals(page: Page): Promise<void> {
  const welcomeModal = page.getByTestId("welcome-modal");

  if (await welcomeModal.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Skip tour" }).click();
    await expect(welcomeModal).toBeHidden();
  }

  const onboardingBackdrop = page.getByRole("button", { name: "Dismiss tour" });

  if (await onboardingBackdrop.isVisible().catch(() => false)) {
    await onboardingBackdrop.click();
    await expect(onboardingBackdrop).toBeHidden();
  }
}

/**
 * Collapsed pilot sidebar + progressive disclosure tiers (Improvement #13).
 * Requires a full-operator build — run `npx playwright test -c playwright.operator-mock.config.ts`
 * (buyer-polished mock builds omit the “Show all features” control).
 */
test.describe("pilot-default operator navigation profile @pilot-nav", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (keys: { presetStorageKey: string; hasSeenOnboardingKey: string; onboardingTourCompletedKey: string }) => {
        // Full navigator preset: tier/disclosure toggles are under test; preset pruning would hide operate links.
        localStorage.setItem(keys.presetStorageKey, "full");
        localStorage.setItem("archlucid-nav-expanded", "false");
        localStorage.setItem("archlucid_nav_show_extended", "false");
        localStorage.setItem("archlucid_nav_show_advanced", "false");
        localStorage.setItem(keys.hasSeenOnboardingKey, "true");
        localStorage.setItem(keys.onboardingTourCompletedKey, "1");
        localStorage.setItem("archlucid_sidebar_recent_activity_open", "0");
        // Collapsed Analysis/Governance groups must not hide extended links from role queries.
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("archlucid_sidebar_group_")) {
            localStorage.removeItem(key);
          }
        }
      },
      {
        presetStorageKey: OPERATOR_SHELL_PRESET_STORAGE_KEY,
        hasSeenOnboardingKey: HAS_SEEN_ONBOARDING_STORAGE_KEY,
        onboardingTourCompletedKey: ONBOARDING_TOUR_COMPLETED_KEY,
      },
    );
  });

  test("pilot profile hides compare and governance until expanded @pilot-nav", async ({ page }) => {
    const meResponse = page.waitForResponse(
      (response) => response.url().includes("/api/proxy/api/auth/me") && response.ok(),
    );

    await page.goto("/");
    await meResponse;
    await dismissBlockingHomeModals(page);

    const reviewNav = page.getByRole("navigation", { name: "Review work" });

    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Governance workflow" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Analysis" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Governance" })).toHaveCount(0);

    const showAllFeatures = page.getByTestId("sidebar-show-all-features-toggle");

    await scrollOperatorSidebarFooterIntoView(page);
    await expect(showAllFeatures).toBeVisible();
    await showAllFeatures.click();

    await expect(page.getByRole("navigation", { name: "Analysis" })).toBeVisible();
    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);

    const layoutDialog = () => page.getByRole("dialog", { name: "Sidebar layout" });

    await scrollOperatorSidebarFooterIntoView(page);
    await page.getByRole("button", { name: "Sidebar layout", exact: true }).click();
    await expect(layoutDialog()).toBeVisible();
    await layoutDialog().locator("#nav-extended").check();
    // Modal dialog marks the sidebar inert for role queries until it closes.
    await page.keyboard.press("Escape");
    await expect(layoutDialog()).toBeHidden();

    const analysisNav = page.getByRole("navigation", { name: "Analysis" });

    await expect(analysisNav.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");

    // Footer toggle survives cluster re-mount when extended tier unlocks; re-opening Sidebar layout flakes in CI.
    const showAdvancedToggle = page.getByTestId("sidebar-show-advanced-operations-toggle");

    await scrollOperatorSidebarFooterIntoView(page);
    await expect(showAdvancedToggle).toBeVisible();
    await showAdvancedToggle.click();

    // Wait for the toggle state to commit before locating the Governance trigger.
    // The advanced-operations toggle sits at the bottom of the sidebar; after it
    // shows advanced groups, Governance renders above the current scroll position.
    // Scroll the sidebar back to the top so the trigger is inside the visible area
    // before Playwright tries to click it — this avoids the scroll-induced detach
    // race that occurs when Playwright auto-scrolls while React is still committing
    // the new tree (authority context re-renders from the window focus transition).
    await expect(showAdvancedToggle).toHaveAttribute("aria-pressed", "true");

    const sidebarNavEl = page.getByTestId("sidebar-nav");

    await sidebarNavEl.evaluate((el) => {
      el.scrollTop = 0;
    });

    await page.getByRole("button", { name: "Governance", exact: true }).click();

    const governanceNav = page.getByRole("navigation", { name: "Governance" });

    await expect(governanceNav.getByRole("link", { name: "Governance workflow" })).toHaveAttribute(
      "href",
      "/governance",
    );
  });
});
