/**
 * Persona-driven UX audit screenshot capture — buyer-polished, full operator shell, and marketing.
 *
 * Run:
 *   npm run ux-audit:screenshots:buyer
 *   npm run ux-audit:screenshots:operator
 *   npm run ux-audit:screenshots:marketing
 *   npm run ux-audit
 *
 * Output: `public/screenshots/ux-audit/{buyer|operator|marketing}/{route-slug}.png`
 */
import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { OPERATE_NAV_UNLOCK_STORAGE_KEY } from "@/lib/usability/operate-nav-progressive-unlock";
import { ONBOARDING_TOUR_COMPLETED_KEY } from "@/lib/onboarding-tour";
import { HAS_SEEN_ONBOARDING_STORAGE_KEY } from "@/lib/operator/operator-welcome-onboarding-storage";
import { SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY } from "@/lib/sidebar-nav-group-expansion-storage";

import { MOCK_TRIAL_WELCOME_RUN_ID } from "./fixtures";
import {
  awaitSponsorRoiDashboardReady,
  prepareSponsorRoiDashboardProxyWaits,
} from "./helpers/sponsor-roi-dashboard";
import { assertPageFreeOfScreenshotDemoFailures } from "./screenshot-demo-quality-gates";
import { publicDirUnderUi } from "./screenshot-output-helpers";
import {
  UX_AUDIT_MARKETING_ROUTES,
  UX_AUDIT_OPERATOR_BUYER_ROUTES,
  resolveUxAuditShellMode,
  type UxAuditRouteEntry,
  type UxAuditShellMode,
} from "./ux-audit-route-registry";

/** Must match `SESSION_KEY` in `TrialWelcomeRunDeepLink.tsx`. */
const TRIAL_WELCOME_HOME_REDIRECT_SESSION_KEY = "archlucid_trial_welcome_home_redirect_v1";

const UX_AUDIT_VIEWPORT = { width: 1440, height: 900 } as const;

const screenshotOptions = {
  animations: "disabled" as const,
  caret: "hide" as const,
  fullPage: true,
};

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

async function primeOperatorShellStorage(page: Page): Promise<void> {
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
    ([sessionKey, welcomeRunId]: readonly [string, string]) => {
      window.sessionStorage.setItem(sessionKey, welcomeRunId);
    },
    [TRIAL_WELCOME_HOME_REDIRECT_SESSION_KEY, MOCK_TRIAL_WELCOME_RUN_ID] as const,
  );
}

async function assertMarketingHeroVisible(page: Page, route: UxAuditRouteEntry): Promise<void> {
  if (route.slug === "welcome") {
    await expect(page.getByRole("heading", { name: /Defensible architecture, on demand/i })).toBeVisible({
      timeout: 60_000,
    });

    return;
  }

  if (route.slug === "why") {
    await expect(page.getByRole("heading", { name: /^Why ArchLucid$/i })).toBeVisible({ timeout: 60_000 });
  }
}

async function captureUxAuditScreenshot(
  page: Page,
  route: UxAuditRouteEntry,
  mode: UxAuditShellMode,
): Promise<void> {
  const roiWaits =
    route.slug === "sponsor-dashboard" ? prepareSponsorRoiDashboardProxyWaits(page) : undefined;

  await page.goto(route.href, { waitUntil: "load", timeout: 90_000 });

  if (route.slug === "shell-reviews-list") {
    await dismissBlockingHomeModals(page);
  }

  if (route.slug === "sponsor-dashboard" && roiWaits !== undefined) {
    await awaitSponsorRoiDashboardReady(page, roiWaits);
  }

  if (mode === "marketing") {
    await assertMarketingHeroVisible(page, route);
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);
  } else {
    await assertPageFreeOfScreenshotDemoFailures(page, route.href);
  }

  const outputDir = publicDirUnderUi("screenshots", "ux-audit", mode);

  fs.mkdirSync(outputDir, { recursive: true });

  await page.screenshot({
    path: path.join(outputDir, `${route.slug}.png`),
    ...screenshotOptions,
  });
}

test.describe.configure({ mode: "parallel", timeout: 120_000 });

test.describe("ux audit screenshots @ux-audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(UX_AUDIT_VIEWPORT);
  });

  for (const route of UX_AUDIT_OPERATOR_BUYER_ROUTES) {
    test(`captures ${route.slug} (${route.persona})`, async ({ page }, testInfo) => {
      const mode = resolveUxAuditShellMode(testInfo.project.name);

      if (mode === null || mode === "marketing") {
        test.skip();
      }

      if (mode === "operator") {
        await primeOperatorShellStorage(page);
      }

      await captureUxAuditScreenshot(page, route, mode);
    });
  }

  for (const route of UX_AUDIT_MARKETING_ROUTES) {
    test(`captures marketing ${route.slug} (${route.persona})`, async ({ page }, testInfo) => {
      const mode = resolveUxAuditShellMode(testInfo.project.name);

      if (mode !== "marketing") {
        test.skip();
      }

      await captureUxAuditScreenshot(page, route, mode);
    });
  }
});
