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
import { PRODUCT_LINE_COOKIE } from "@/lib/product-line/product-line-storage";
import { SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY } from "@/lib/sidebar-nav-group-expansion-storage";
import { OPERATE_NAV_UNLOCK_STORAGE_KEY } from "@/lib/usability/operate-nav-progressive-unlock";

import {
  fixtureArtifactDescriptorsScreenshot,
  fixtureComparisonExplanation,
  fixtureGoldenManifestComparisonScreenshot,
  fixtureLegacyRunComparisonScreenshot,
  fixtureManifestSummaryScreenshot,
  fixtureRunDetailScreenshot,
  SCREENSHOT_APPROVAL_ID,
  SCREENSHOT_FINDING_ID,
  SCREENSHOT_LEFT_RUN_ID,
  SCREENSHOT_MANIFEST_ID,
  SCREENSHOT_RIGHT_RUN_ID,
  SCREENSHOT_RUN_ID,
} from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import { waitForLiveOperatorPageHydration } from "./helpers/live-page-readiness";
import {
  FIXTURE_EMPTY_ZIP_BYTES,
  registerOperatorJourneyApiRoutes,
  registerScreenshotSuiteProxyRoutes,
} from "./helpers/register-operator-api-routes";
import {
  assertPageFreeOfScreenshotDemoFailures,
  waitForScreenshotOperatorShellChildren,
} from "./screenshot-demo-quality-gates";
import { screenshotEffectiveHref } from "./screenshot-legacy-redirects";
import { publicDirUnderUi } from "./screenshot-output-helpers";
import { SECURENOW_UI_RATE_ROUTES } from "./securenow-ui-rate-route-registry";

const UX_AUDIT_VIEWPORT = { width: 1440, height: 900 } as const;

const SECURENOW_BASE_URL = `http://127.0.0.1:${process.env.MOCK_E2E_SECURENOW_PORT ?? "3004"}`;

/** Skeleton-only captures stay tiny and identical — fail the run before Opus rates grey boxes. */
const MIN_MAIN_TEXT_LENGTH = 80;

const MIN_PNG_BYTES = 12_000;

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

/**
 * The product line must be readable on the first document request. Setting it from an init script only lands
 * after that request, so the server renders the default line and `ProductLineRouteGate` bounces SecureNow
 * routes to home — each test gets a fresh context, so every gated route captures the wrong page.
 */
async function primeSecureNowProductLineCookie(page: Page, baseUrl: string): Promise<void> {
  await page.context().addCookies([
    {
      name: PRODUCT_LINE_COOKIE,
      value: "security",
      url: baseUrl,
      sameSite: "Lax",
    },
  ]);
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
    },
    {
      hasSeenOnboardingKey: HAS_SEEN_ONBOARDING_STORAGE_KEY,
      onboardingTourCompletedKey: ONBOARDING_TOUR_COMPLETED_KEY,
      sidebarGroupExpansionKey: SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
      operateNavUnlockStorageKey: OPERATE_NAV_UNLOCK_STORAGE_KEY,
    },
  );
}

/**
 * `useProductLine` resolves client-side, so the shell renders the default ArchLucid wordmark, trial banner, and
 * demo workspace switcher for a beat after hydration reports ready. Capturing in that window rates the wrong
 * product shell, which is worse than a blank frame because it looks plausible.
 */
async function waitForSecureNowBrandSettled(page: Page): Promise<void> {
  await expect(page.getByTestId("archlucid-wordmark-link")).toHaveText(/SecureNow/, { timeout: 60_000 });
}

async function waitForSecureNowScreenshotHydration(page: Page, href: string): Promise<string> {
  await waitForLiveOperatorPageHydration(page, { timeoutMs: 90_000 });
  await waitForSecureNowBrandSettled(page);

  const effectiveHref = screenshotEffectiveHref(page.url());

  await waitForScreenshotOperatorShellChildren(page, href, effectiveHref);

  const main = getAppMain(page);

  await expect(main).toBeVisible({ timeout: 60_000 });

  await expect
    .poll(async () => (await main.innerText()).trim().length, { timeout: 90_000 })
    .toBeGreaterThan(MIN_MAIN_TEXT_LENGTH);

  await assertPageFreeOfScreenshotDemoFailures(page, effectiveHref);

  return effectiveHref;
}

async function captureSecureNowScreenshot(page: Page, slug: string, href: string): Promise<void> {
  await page.goto(href, { waitUntil: "load", timeout: 120_000 });

  if (href === "/") {
    await dismissBlockingHomeModals(page);
  }

  const effectiveHref = await waitForSecureNowScreenshotHydration(page, href);

  if (href !== "/" && new URL(page.url()).pathname === "/") {
    throw new Error(
      `Route ${href} landed on home (effective ${effectiveHref}); product line gate bounced the capture.`,
    );
  }

  const outputDir = publicDirUnderUi("screenshots", "securenow-ui-rate");

  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${slug}.png`);

  await page.screenshot({
    path: outputPath,
    ...screenshotOptions,
  });

  const stat = fs.statSync(outputPath);

  if (stat.size < MIN_PNG_BYTES) {
    throw new Error(
      `Screenshot too small for ${href} (${stat.size} bytes < ${MIN_PNG_BYTES}); likely skeleton or blank capture.`,
    );
  }
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe("securenow ui rate screenshots @securenow-ui-rate", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(UX_AUDIT_VIEWPORT);
    await primeSecureNowProductLineCookie(page, SECURENOW_BASE_URL);
    await primeSecureNowShellStorage(page);
    await registerOperatorJourneyApiRoutes(page, {
      runDetail: { runId: SCREENSHOT_RUN_ID, body: fixtureRunDetailScreenshot() },
      manifestSummary: { manifestId: SCREENSHOT_MANIFEST_ID, body: fixtureManifestSummaryScreenshot() },
      artifactList: { manifestId: SCREENSHOT_MANIFEST_ID, body: fixtureArtifactDescriptorsScreenshot() },
      artifactBundle: { manifestId: SCREENSHOT_MANIFEST_ID, body: FIXTURE_EMPTY_ZIP_BYTES, headOk: true },
      legacyCompare: {
        leftRunId: SCREENSHOT_LEFT_RUN_ID,
        rightRunId: SCREENSHOT_RIGHT_RUN_ID,
        body: fixtureLegacyRunComparisonScreenshot(),
      },
      structuredCompare: {
        baseRunId: SCREENSHOT_LEFT_RUN_ID,
        targetRunId: SCREENSHOT_RIGHT_RUN_ID,
        body: fixtureGoldenManifestComparisonScreenshot(),
      },
      compareExplanation: {
        baseRunId: SCREENSHOT_LEFT_RUN_ID,
        targetRunId: SCREENSHOT_RIGHT_RUN_ID,
        body: fixtureComparisonExplanation(),
      },
    });
    await registerScreenshotSuiteProxyRoutes(page);
  });

  for (const route of SECURENOW_UI_RATE_ROUTES) {
    test(`captures ${route.slug} (${route.href})`, async ({ page }) => {
      await captureSecureNowScreenshot(page, route.slug, route.href);
    });
  }
});
