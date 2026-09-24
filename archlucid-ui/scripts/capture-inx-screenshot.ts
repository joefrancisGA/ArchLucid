/**
 * One-off SecureNow INX capture against a running Security dev server (:3001).
 * Uses the same Playwright proxy stubs as securenow-ui-rate-screenshots.spec.ts.
 */
import fs from "node:fs";
import path from "node:path";

import { expect, chromium, type Page } from "@playwright/test";

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
  SCREENSHOT_LEFT_RUN_ID,
  SCREENSHOT_MANIFEST_ID,
  SCREENSHOT_RIGHT_RUN_ID,
  SCREENSHOT_RUN_ID,
} from "../e2e/fixtures";
import { getAppMain } from "../e2e/helpers/app-main";
import { waitForLiveOperatorPageHydration } from "../e2e/helpers/live-page-readiness";
import {
  registerOperatorJourneyApiRoutes,
  registerScreenshotSuiteProxyRoutes,
} from "../e2e/helpers/register-operator-api-routes";

const FIXTURE_EMPTY_ZIP_BYTES = Buffer.from([
  0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);
import {
  assertPageFreeOfScreenshotDemoFailures,
  waitForScreenshotOperatorShellChildren,
} from "../e2e/screenshot-demo-quality-gates";
import { screenshotEffectiveHref } from "../e2e/screenshot-legacy-redirects";
import { publicDirUnderUi } from "../e2e/screenshot-output-helpers";

const UX_AUDIT_VIEWPORT = { width: 1440, height: 900 } as const;
const baseUrl = process.env.SECURENOW_BASE_URL ?? "http://127.0.0.1:3001";
const href = "/infrastructure/extract-upload";
const slug = "infrastructure-extract-upload";

async function primeSecureNowProductLineCookie(page: Page): Promise<void> {
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

async function waitForSecureNowBrandSettled(page: Page): Promise<void> {
  await expect(page.getByTestId("archlucid-wordmark-link")).toHaveText(/SecureNow/, { timeout: 60_000 });
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: UX_AUDIT_VIEWPORT });

  await primeSecureNowProductLineCookie(page);
  await primeSecureNowShellStorage(page);

  await page.route("**/api/proxy/api/auth/me**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        name: "E2E screenshot operator",
        claims: [{ type: "roles", value: "Admin" }],
        hasCommittedArchitectureReview: true,
      }),
    });
  });

  await page.route("**/v1/tenant/workspace-baseline-artifacts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ hasBaselineArtifacts: false, extractorScriptVersion: "1.0.0" }),
    });
  });

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

  await page.goto(`${baseUrl}${href}`, { waitUntil: "load", timeout: 120_000 });
  await waitForLiveOperatorPageHydration(page, { timeoutMs: 90_000 });
  await waitForSecureNowBrandSettled(page);

  const effectiveHref = screenshotEffectiveHref(page.url());
  await waitForScreenshotOperatorShellChildren(page, href, effectiveHref);

  const main = getAppMain(page);
  await expect(main).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(async () => (await main.innerText()).trim().length, { timeout: 90_000 })
    .toBeGreaterThan(80);

  await assertPageFreeOfScreenshotDemoFailures(page, effectiveHref);

  const outputDir = publicDirUnderUi("screenshots", "securenow-ui-rate");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${slug}.png`);

  await page.screenshot({
    path: outputPath,
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });

  const stat = fs.statSync(outputPath);
  if (stat.size < 12_000) {
    throw new Error(`Screenshot too small (${stat.size} bytes)`);
  }

  console.log(JSON.stringify({ outputPath, bytes: stat.size, url: page.url() }, null, 2));

  await browser.close();
}

void main();
