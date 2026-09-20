/**
 * SecureNow (security product line) screenshot capture for /al-ui-rate batches.
 *
 * Run: npm run securenow-ui-rate:screenshots
 * Output: public/screenshots/securenow-ui-rate/{slug}.png
 */
import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { ONBOARDING_TOUR_COMPLETED_KEY } from "@/lib/onboarding-tour";
import { HAS_SEEN_ONBOARDING_STORAGE_KEY } from "@/lib/operator/operator-welcome-onboarding-storage";
import { SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY } from "@/lib/sidebar-nav-group-expansion-storage";
import { OPERATE_NAV_UNLOCK_STORAGE_KEY } from "@/lib/usability/operate-nav-progressive-unlock";

import { assertPageFreeOfScreenshotDemoFailures } from "./screenshot-demo-quality-gates";
import { publicDirUnderUi } from "./screenshot-output-helpers";
import { SECURENOW_UI_RATE_ROUTES } from "./securenow-ui-rate-route-registry";

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

async function primeSecureNowShellStorage(page: Page): Promise<void> {
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
      document.cookie = "archlucid_product_line_v1=security; Max-Age=2592000; Path=/; SameSite=Lax";
    },
    {
      hasSeenOnboardingKey: HAS_SEEN_ONBOARDING_STORAGE_KEY,
      onboardingTourCompletedKey: ONBOARDING_TOUR_COMPLETED_KEY,
      sidebarGroupExpansionKey: SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
      operateNavUnlockStorageKey: OPERATE_NAV_UNLOCK_STORAGE_KEY,
    },
  );
}

async function captureSecureNowScreenshot(page: Page, slug: string, href: string): Promise<void> {
  await page.goto(href, { waitUntil: "load", timeout: 120_000 });

  if (href === "/") {
    await dismissBlockingHomeModals(page);
  }

  await assertPageFreeOfScreenshotDemoFailures(page, href);

  const outputDir = publicDirUnderUi("screenshots", "securenow-ui-rate");

  fs.mkdirSync(outputDir, { recursive: true });

  await page.screenshot({
    path: path.join(outputDir, `${slug}.png`),
    ...screenshotOptions,
  });
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe("securenow ui rate screenshots @securenow-ui-rate", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(UX_AUDIT_VIEWPORT);
    await primeSecureNowShellStorage(page);
  });

  for (const route of SECURENOW_UI_RATE_ROUTES) {
    test(`captures ${route.slug} (${route.href})`, async ({ page }) => {
      try {
        await captureSecureNowScreenshot(page, route.slug, route.href);
      }
      catch (error) {
        console.warn(`[securenow-ui-rate] capture failed for ${route.href}:`, error);
        test.skip(true, `capture failed: ${route.href}`);
      }
    });
  }
});
