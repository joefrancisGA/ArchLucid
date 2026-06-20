import { expect, test, type Page } from "@playwright/test";

import { MOCK_TRIAL_WELCOME_RUN_ID } from "./fixtures/ids";
import { ONBOARDING_TOUR_COMPLETED_KEY } from "@/lib/onboarding-tour";
import { HAS_SEEN_ONBOARDING_STORAGE_KEY } from "@/lib/operator-welcome-onboarding-storage";

/** Must match `SESSION_KEY` in `TrialWelcomeRunDeepLink.tsx`. */
const TRIAL_WELCOME_HOME_REDIRECT_SESSION_KEY = "archlucid_trial_welcome_home_redirect_v1";

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
    await page.getByRole("button", { name: "Skip for now" }).click();
    await expect(welcomeModal).toBeHidden();
  }

  const onboardingBackdrop = page.getByRole("button", { name: "Dismiss tour" });

  if (await onboardingBackdrop.isVisible().catch(() => false)) {
    await onboardingBackdrop.click();
    await expect(onboardingBackdrop).toBeHidden();
  }
}

/** Matches SidebarNav.test.tsx: per-group "N more" avoids removed Sidebar layout dialog in V1. */
async function enableExtendedNavTierViaReviewWorkDisclosure(page: Page): Promise<void> {
  await expect(async () => {
    await scrollOperatorSidebarFooterIntoView(page);

    const reviewMore = page.getByRole("button", { name: /Show \d+ more destinations in Review work/ });

    await expect(reviewMore).toBeVisible();
    await reviewMore.click();
    await expect(page.getByRole("navigation", { name: "Analysis" })).toBeVisible();
  }).toPass({ timeout: 30_000 });
}

/**
 * Collapsed pilot sidebar + progressive disclosure tiers (Improvement #13).
 * Requires a full-operator build — run `npx playwright test -c playwright.operator-mock.config.ts`
 * (buyer-polished mock builds omit the “Show all features” control).
 */
test.describe("pilot-default operator navigation profile @pilot-nav", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (keys: { hasSeenOnboardingKey: string; onboardingTourCompletedKey: string }) => {
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
        hasSeenOnboardingKey: HAS_SEEN_ONBOARDING_STORAGE_KEY,
        onboardingTourCompletedKey: ONBOARDING_TOUR_COMPLETED_KEY,
      },
    );
    await page.addInitScript(
      ([key, welcomeRunId]: readonly [string, string]) => {
        // Mock trial-status exposes trialWelcomeRunId; prime guard so operator home stays on `/`.
        window.sessionStorage.setItem(key, welcomeRunId);
      },
      [TRIAL_WELCOME_HOME_REDIRECT_SESSION_KEY, MOCK_TRIAL_WELCOME_RUN_ID] as const,
    );
  });

  test("pilot profile hides compare and governance until expanded @pilot-nav", async ({ page }) => {
    const meResponse = page.waitForResponse(
      (response) => response.url().includes("/api/proxy/api/auth/me") && response.ok(),
    );

    // Reviews list keeps full operator chrome; operator home (`/`) can redirect via TrialWelcomeRunDeepLink
    // or mount heavy first-pilot surfaces that flake in mock operator-shell CI.
    await page.goto("/reviews?projectId=default");
    await meResponse;
    await dismissBlockingHomeModals(page);
    await expect(page).toHaveURL((url) => new URL(url).pathname === "/reviews");
    await expect(page.getByTestId("sidebar-nav")).toBeVisible({ timeout: 30_000 });

    const reviewNav = page.getByRole("navigation", { name: "Review work" });

    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Governance workflow" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Analysis" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Governance", exact: true })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Governance — pinned links" })).toHaveCount(0);

    await enableExtendedNavTierViaReviewWorkDisclosure(page);

    const analysisNav = page.getByRole("navigation", { name: "Analysis" });

    await expect(analysisNav).toBeVisible({ timeout: 15_000 });
    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(analysisNav.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");
    await expect(page.getByRole("navigation", { name: "Governance", exact: true })).toHaveCount(0);

    await scrollOperatorSidebarFooterIntoView(page);
    await page.getByTestId("sidebar-governance-disclosure-toggle").click();

    const governanceNav = page.getByRole("navigation", { name: "Governance", exact: true });

    await expect(governanceNav).toBeVisible({ timeout: 15_000 });
    await expect(governanceNav.getByRole("link", { name: "Governance workflow" })).toHaveAttribute(
      "href",
      "/governance",
    );
  });
});
