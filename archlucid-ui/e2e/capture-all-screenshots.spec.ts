import { expect, test } from "@playwright/test";

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
  SCREENSHOT_PLAN_ID,
  SCREENSHOT_POLICY_PACK_ID,
  SCREENSHOT_RIGHT_RUN_ID,
  SCREENSHOT_RUN_ID,
  SHOWCASE_DEMO_RUN_ID,
} from "./fixtures";
import {
  FIXTURE_EMPTY_ZIP_BYTES,
  registerOperatorJourneyApiRoutes,
  registerScreenshotSuiteProxyRoutes,
} from "./helpers/register-operator-api-routes";
import { publicDirUnderUi } from "./screenshot-output-helpers";
import { screenshotEffectiveHref, waitForScreenshotLegacyRedirects } from "./screenshot-legacy-redirects";
import { assertPageFreeOfScreenshotDemoFailures, waitForScreenshotOperatorShellChildren } from "./screenshot-demo-quality-gates";

const OUT = publicDirUnderUi("screenshots", "all-routes");

/** Each route runs as its own parallel test; generous ceiling for cold Next + mock on shared webServer. */
const PER_ROUTE_SCREENSHOT_TIMEOUT_MS = 12 * 60 * 1_000;

function slugForHref(href: string): string {
  const noLead = href.replace(/^\//, "");

  return (noLead.length > 0 ? noLead : "index").replace(/[/?&=]+/g, "-").replace(/-+/g, "-");
}

/** One href per `page.tsx` (62 routes); run/manifest/compare paths use {@link SCREENSHOT_*} for human-readable URLs. Legacy `/getting-started` redirects to `/onboarding`. */
const HREFS: string[] = [
  "/",
  "/accessibility",
  "/governance/advisory-scans",
  "/governance/advisory-scans?tab=schedules",
  "/internal/health",
  "/administration/support",
  "/administration/users",
  "/governance/alerts",
  "/insights/ask-review-questions",
  "/governance/audit",
  "/auth/callback",
  "/auth/signin",
  `/insights/compare-two-reviews?${new URLSearchParams({ leftRunId: SCREENSHOT_LEFT_RUN_ID, rightRunId: SCREENSHOT_RIGHT_RUN_ID }).toString()}`,
  "/compliance-journey",
  "/demo/explain",
  "/demo/preview",
  "/architecture/digests?tab=subscriptions",
  "/architecture/digests",
  "/insights/impact-preview",
  "/architecture/first-review-guide",
  "/governance/approval-queue",
  "/architecture/sponsor-dashboard#workspace-health",
  "/governance/findings",
  `/governance/approval-requests/${encodeURIComponent(SCREENSHOT_APPROVAL_ID)}/lineage`,
  `/governance/policy-packs/${encodeURIComponent(SCREENSHOT_POLICY_PACK_ID)}`,
  "/governance/standards-and-rules",
  "/insights/evidence-graph",
  "/help",
  "/integrations/teams",
  "/get-started",
  "/live-demo",
  `/governance/sealed-records/${encodeURIComponent(SCREENSHOT_MANIFEST_ID)}`,
  "/insights/improvement-planning",
  `/insights/improvement-planning/plans/${encodeURIComponent(SCREENSHOT_PLAN_ID)}`,
  "/governance/policy-packs",
  "/pricing",
  "/privacy",
  "/internal/product-learning",
  "/internal/recommendation-learning",
  "/internal/replay",
  "/architecture/reviews",
  "/architecture/reviews/new",
  `/architecture/reviews/${encodeURIComponent(SCREENSHOT_RUN_ID)}`,
  `/architecture/reviews/${encodeURIComponent(SCREENSHOT_RUN_ID)}/findings/${encodeURIComponent(SCREENSHOT_FINDING_ID)}`,
  `/architecture/reviews/${encodeURIComponent(SCREENSHOT_RUN_ID)}/findings/${encodeURIComponent(SCREENSHOT_FINDING_ID)}/evidence-trace`,
  `/architecture/reviews/${encodeURIComponent(SCREENSHOT_RUN_ID)}/provenance`,
  "/insights/search-review-evidence",
  "/security-trust",
  "/see-it",
  `/showcase/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`,
  "/administration/baseline",
  "/architecture/digests?tab=schedule",
  "/administration/workspace-settings",
  "/signup",
  "/signup/verify",
  "/trust",
  "/insights/sponsor-report",
  "/welcome",
  "/why",
  "/why-archlucid",
  "/administration/security-trust",
];

function filePathForHref(href: string): string {
  return `${OUT}/${slugForHref(href)}.png`;
}

test.describe.parallel("all routes screenshots (mock API)", () => {
  test.describe.configure({ timeout: PER_ROUTE_SCREENSHOT_TIMEOUT_MS });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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

  for (const href of HREFS) {
    test(`PNG ${slugForHref(href)}`, async ({ page }) => {
      // `networkidle` rarely settles on Next.js (open connections); health route proxy GETs must still resolve A1 see registerScreenshotSuiteProxyRoutes.
      await page.goto(href, { waitUntil: "load", timeout: 120_000 });

      await waitForScreenshotLegacyRedirects(page, href);

      /** Wait for hydrated shell ({@link AppShellClient} / {@link ShellReadySurface}); `networkidle` is unreliable on Next.js. */
      try {
        await page.locator("[data-app-ready=\"true\"]").waitFor({ state: "attached", timeout: 60_000 });
      } catch (e) {
        throw new Error(
          `data-app-ready not found for href=${href} (url=${page.url()}). Use a free UI port, run mock webServer (see playwright.mock.config), ` +
            `and avoid MOCK_E2E_REUSE_SERVER unless the correct standalone app is already listening. ${(e as Error).message}`,
        );
      }

      const effectiveHref = screenshotEffectiveHref(page.url());

      await waitForScreenshotOperatorShellChildren(page, href, effectiveHref);

      await expect(page.locator("body")).toBeVisible({ timeout: 120_000 });
      await assertPageFreeOfScreenshotDemoFailures(page, effectiveHref);
      await page.screenshot({ path: filePathForHref(href), fullPage: true });
    });
  }
});
