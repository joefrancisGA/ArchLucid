import { expect, test, type Locator, type Page } from "@playwright/test";

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

/** Collapsible triggers detach when /me refetch re-mounts sidebar clusters; DOM click + toPass avoids Playwright scroll flake. */
async function clickSidebarDisclosureTrigger(sidebarNav: Locator, ariaControlsId: string): Promise<void> {
  await expect(async () => {
    await sidebarNav.evaluate((element) => {
      element.scrollTop = 0;
    });

    const trigger = sidebarNav.locator(`[aria-controls="${ariaControlsId}"]`);

    await expect(trigger).toHaveCount(1);
    await trigger.evaluate((button: HTMLButtonElement) => {
      button.click();
    });
  }).toPass({ timeout: 15_000 });
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

    const layoutDialog = () => page.getByRole("dialog", { name: "Sidebar layout" });

    await scrollOperatorSidebarFooterIntoView(page);
    await page.getByRole("button", { name: "Sidebar layout", exact: true }).click();
    await expect(layoutDialog()).toBeVisible();
    await layoutDialog().locator("#nav-extended").check();
    // Modal dialog marks the sidebar inert for role queries until it closes.
    await page.keyboard.press("Escape");
    await expect(layoutDialog()).toBeHidden();

    const showAllFeatures = page.getByTestId("sidebar-show-all-features-toggle");

    await scrollOperatorSidebarFooterIntoView(page);
    await expect(showAllFeatures).toBeVisible();
    await showAllFeatures.click();

    const analysisNav = page.getByRole("navigation", { name: "Analysis" });

    await expect(analysisNav).toBeVisible();
    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(analysisNav.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");

    const sidebarNavEl = page.getByTestId("sidebar-nav");

    await clickSidebarDisclosureTrigger(sidebarNavEl, "sidebar-group-operate-governance-content");

    const governanceNav = page.getByRole("navigation", { name: "Governance" });

    await expect(governanceNav).toBeVisible();
    await expect(governanceNav.getByRole("link", { name: "Governance workflow" })).toHaveCount(0);

    const showAdvancedToggle = page.getByTestId("sidebar-show-advanced-operations-toggle");

    await scrollOperatorSidebarFooterIntoView(page);
    await expect(showAdvancedToggle).toBeVisible();
    await showAdvancedToggle.click();
    await expect(showAdvancedToggle).toHaveAttribute("aria-pressed", "true");

    await expect(governanceNav.getByRole("link", { name: "Governance workflow" })).toHaveAttribute(
      "href",
      "/governance",
    );
  });
});
