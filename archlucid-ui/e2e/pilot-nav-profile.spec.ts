import { expect, test, type Page } from "@playwright/test";

import { OPERATE_NAV_UNLOCK_STORAGE_KEY } from "@/lib/usability/operate-nav-progressive-unlock";

import { MOCK_TRIAL_WELCOME_RUN_ID } from "./fixtures/ids";
import { ONBOARDING_TOUR_COMPLETED_KEY } from "@/lib/onboarding-tour";
import { HAS_SEEN_ONBOARDING_STORAGE_KEY } from "@/lib/operator/operator-welcome-onboarding-storage";
import { SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY } from "@/lib/sidebar-nav-group-expansion-storage";

/** Must match `SESSION_KEY` in `TrialWelcomeRunDeepLink.tsx`. */
const TRIAL_WELCOME_HOME_REDIRECT_SESSION_KEY = "archlucid_trial_welcome_home_redirect_v1";

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

/**
 * Collapsed pilot sidebar + per-group chevron disclosure (V1 calm first-run nav).
 * Requires a full-operator build — run `npx playwright test -c playwright.operator-mock.config.ts`
 * (buyer-polished mock builds omit Administration and some platform-admin clusters).
 */
test.describe("pilot-default operator navigation profile @pilot-nav", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (keys: {
        hasSeenOnboardingKey: string;
        onboardingTourCompletedKey: string;
        sidebarGroupExpansionKey: string;
        operateNavUnlockStorageKey: string;
      }) => {
        localStorage.removeItem(keys.sidebarGroupExpansionKey);
        localStorage.setItem(keys.operateNavUnlockStorageKey, "0");
        localStorage.setItem("archlucid-nav-expanded", "false");
        localStorage.setItem("archlucid_nav_show_extended", "false");
        localStorage.setItem("archlucid_nav_show_advanced", "false");
        localStorage.setItem("archlucid_nav_show_administration", "0");
        localStorage.removeItem("archlucid.buyerCtoDemoTour.active.v1");
        localStorage.setItem(keys.hasSeenOnboardingKey, "true");
        localStorage.setItem(keys.onboardingTourCompletedKey, "1");
        localStorage.setItem("archlucid_sidebar_recent_activity_open", "0");
      },
      {
        hasSeenOnboardingKey: HAS_SEEN_ONBOARDING_STORAGE_KEY,
        onboardingTourCompletedKey: ONBOARDING_TOUR_COMPLETED_KEY,
        sidebarGroupExpansionKey: SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
        operateNavUnlockStorageKey: OPERATE_NAV_UNLOCK_STORAGE_KEY,
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

  test("pilot profile hides compare and governance until group disclosure @pilot-nav", async ({ page }) => {
    const meResponse = page.waitForResponse(
      (response) => response.url().includes("/api/proxy/api/auth/me") && response.ok(),
    );

    // Reviews list keeps full operator chrome; operator home (`/`) can redirect via TrialWelcomeRunDeepLink
    // or mount heavy first-pilot surfaces that flake in mock operator-shell CI.
    await page.goto("/architecture/reviews");
    await meResponse;
    await dismissBlockingHomeModals(page);
    await expect(page).toHaveURL((url) => new URL(url).pathname === "/architecture/reviews");
    await expect(page.getByTestId("sidebar-nav")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("llm-budget-status-pill")).toHaveCount(0);

    const reviewNav = page.getByRole("group", { name: "Architecture" });

    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Approval queue" })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Insights" })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Governance", exact: true })).toHaveCount(0);

    const analysisToggle = page.getByTestId("sidebar-group-toggle-operate-analysis");

    await expect(analysisToggle).toBeVisible({ timeout: 15_000 });
    await expect(analysisToggle).toHaveAttribute("aria-expanded", "false");

    await analysisToggle.click();

    const analysisNav = page.getByRole("group", { name: "Insights" });

    await expect(analysisNav).toBeVisible({ timeout: 15_000 });
    await expect(reviewNav.getByRole("link", { name: "Compare two reviews" })).toHaveCount(0);
    await expect(analysisNav.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/insights/compare-two-reviews");
    await expect(page.getByRole("group", { name: "Governance", exact: true })).toHaveCount(0);

    await page.evaluate((storageKey) => {
      localStorage.setItem(storageKey, "2");
      window.dispatchEvent(new Event("archlucid-operate-nav-unlock-changed"));
    }, OPERATE_NAV_UNLOCK_STORAGE_KEY);

    await expect(page.getByTestId("sidebar-group-toggle-operate-governance")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("sidebar-group-toggle-operate-governance").click();

    const governanceNav = page.getByRole("group", { name: "Governance", exact: true });
    const riskRegisterLink = governanceNav.getByTestId("nav-operate-governance-findings");
    const governanceWorkflowLink = governanceNav.getByTestId("nav-operate-governance-workflow");

    await expect(governanceNav).toBeVisible({ timeout: 15_000 });
    // Pilot profile keeps advanced-tier workflow routes hidden until extended+advanced disclosure is on.
    await expect(riskRegisterLink).toBeVisible();
    await expect(riskRegisterLink).toHaveAttribute("href", "/governance/findings");
    // Authority-only nav (owner 2026-08-03): unlock phase no longer hides workflow.
    await expect(governanceWorkflowLink).toBeVisible();
    await expect(governanceWorkflowLink).toHaveAttribute("href", "/governance/approval-queue");
  });
});
