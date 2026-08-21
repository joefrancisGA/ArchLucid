import { expect, test, type Page } from "@playwright/test";

import {
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
  RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN,
  SCREENSHOT_RUN_ID,
  SHOWCASE_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import { reviewsHubPackagePrimaryAction, reviewsHubPackageRow } from "./helpers/reviews-hub";
import { escapeRegExpSource } from "./helpers/escape-reg-exp-source";
import {
  isShowcaseSignedManifestBrowserPath,
  showcaseSignedManifestBrowserUrlPattern,
} from "./helpers/buyer-golden-path";
import { expectGraphPageReadySurface, expectMainHasNoHardFailureChrome, runsDashboardBuyerProofSummary } from "./helpers/operator-journey";

const claimsShowcasePath = "/showcase/customer-intake-modernization";

/**
 * Marketing showcase QuickNav (`ShowcaseQuickNav`) uses "Open manifest"; review-trail cards use "Manifest";
 * operator runs table still uses "Finalized manifest". Proof-chain tests accept any stable deep-link label.
 */

/** Branded 404 — assert visible recovery copy plus stable recovery affordances from OperatorBrandedNotFound. */
async function expectBrandedNotFoundSurface(page: Page): Promise<void> {
  const main = getAppMain(page);

  await expect(main.getByText(/Not found in this workspace/i)).toBeVisible();
  await expect(main.getByTestId("branded-not-found")).toBeAttached();
  await expect(main.getByTestId("not-found-review-packages")).toBeVisible();
}

/** Canonical run detail path is `/architecture/reviews/{runId}`; legacy `/runs/*` bookmarks are retired (IA batch 4). */
function showcaseDemoReviewDetailUrlPattern(): RegExp {
  return new RegExp(`/(?:reviews|runs)/${escapeRegExpSource(SHOWCASE_DEMO_RUN_ID)}`);
}

/**
 * Validates the mock-backed “proof chain”: runs list → run detail → manifest detail.
 * Run in isolation: `npx playwright test -c playwright.mock.config.ts e2e/demo-readiness.spec.ts`
 * or `npx playwright test --grep @demo-readiness`.
 */
test.describe.parallel("demo-readiness — mock proof chain @demo-readiness", () => {
  test("policy pack rejects literal undefined token route @demo-readiness", async ({ page }) => {
    await page.goto("/governance/policy-packs/undefined");
    await expectBrandedNotFoundSurface(page);
  });

  test("runs list shows Customer Intake example without mock-provider leakage", async ({ page }) => {
    await page.goto("/architecture/reviews");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(page.getByText(/Enterprise Customer Intake Modernization/i).first()).toBeVisible();
    await expect(page.getByText(/mock API/i)).toHaveCount(0);
  });

  test("run detail avoids not-found shells, bogus pipeline progress, and invalid dates", async ({ page }) => {
    await page.goto(`/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    const primaryMain = getAppMain(page);
    await expect(primaryMain).not.toContainText(/run not found/i);
    await expectMainHasNoHardFailureChrome(page);
    await expect(primaryMain).not.toContainText(/Invalid Date/i);
    await expect(primaryMain.getByText(/\b0 of 4 run pipeline stages complete\b/i)).toHaveCount(0);

    await page.goto(`/architecture/reviews/${encodeURIComponent(SCREENSHOT_RUN_ID)}`);
    await expect(page).toHaveURL(showcaseDemoReviewDetailUrlPattern());
    await expect(getAppMain(page)).not.toContainText(/run not found/i);
  });

  test("showcase-aligned manifest UUID loads manifest chrome (not indefinite skeleton)", async ({ page }) => {
    await page.goto(`/governance/sealed-records/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`);
    await expect(page.getByRole("heading", { name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN, level: 1 })).toBeVisible();
    const primaryMain = getAppMain(page);
    await expect(primaryMain).toHaveCount(1);
    await expect(primaryMain).not.toContainText(/review record summary could not be loaded/i);
    await expectMainHasNoHardFailureChrome(page);
  });

  test("marketing showcase exposes working deep links into operator proof pages", async ({ page }) => {
    await page.goto(claimsShowcasePath);
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
      /completed architecture output|Completed example/i,
    );

    // Scope to ShowcaseQuickNav — loose /Review/i also matches "Review finding" / timeline "Open review".
    const showcaseQuickNav = page.getByRole("region", { name: /Explore in workspace/i });
    await showcaseQuickNav.getByRole("link", { name: "Review", exact: true }).click();
    await expect(page).toHaveURL(showcaseDemoReviewDetailUrlPattern());
    await expect(getAppMain(page)).not.toContainText(/Invalid Date/i);

    await page.goto(claimsShowcasePath);
    await page
      .getByRole("region", { name: /Explore in workspace/i })
      .getByRole("link", { name: "Open finalized record", exact: true })
      .click();
    await expect(page).toHaveURL(showcaseSignedManifestBrowserUrlPattern());
    await expect(page.getByRole("heading", { name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN, level: 1 })).toBeVisible();
  });

  test("demo pages do not leak internal tokens in main content @demo-readiness", async ({ page }) => {
    const paths: string[] = [
      "/",
      "/architecture/reviews",
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`,
      `/governance/sealed-records/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`,
      "/governance/approval-queue",
      "/help",
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent("sensitive-data-minimization-risk")}`,
    ];

    const banned = [
      /undefined/,
      /\bnull\b/i,
      /\bfixture\b/i,
      /\bmock\b/i,
      /localhost/i,
      /Invalid Date/i,
      /\boperator access\b/i,
      /\bAPI-gated\b/i,
      /\bAP-gated\b/i,
      /\br1\b/i,
      /\blegacy\b/i,
      /Execute\+/,
      /Development workspace/i,
    ];

    for (const path of paths) {
      await page.goto(path);
      const mainText = await getAppMain(page).innerText();

      for (const pattern of banned) {
        expect(mainText, `Unexpected token on ${path}`).not.toMatch(pattern);
      }
    }
  });

  test("core demo smoke — home, new request, runs, run detail, manifest, finding, showcase @demo-readiness", async ({
    page,
  }) => {
    await page.goto("/");
    /** Mock E2E uses buyer-polished demo: home surfaces the featured package proof summary, not a review-title heading. */
    await expect(runsDashboardBuyerProofSummary(page)).toBeVisible();

    await page.goto("/architecture/reviews/new");
    await expect(page).toHaveURL(/\/architecture\/reviews\/new/);

    await page.goto("/architecture/reviews");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    // Buyer-polished table rows expose two Action links ("View review", "View signed manifest");
    // target the primary explore link via stable test id (Playwright strict mode).
    const appMain = getAppMain(page);
    const claimsTableRow = reviewsHubPackageRow(appMain, SHOWCASE_DEMO_RUN_ID).first();
    await expect(claimsTableRow).toBeVisible();
    await reviewsHubPackagePrimaryAction(appMain, SHOWCASE_DEMO_RUN_ID).click();
    const afterListClickUrl = new RegExp(
      `(?:/governance/sealed-records/${escapeRegExpSource(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}|/architecture/reviews/${escapeRegExpSource(SHOWCASE_DEMO_RUN_ID)}(?:/architecture)?)`,
    );
    await expect(page).toHaveURL(afterListClickUrl);

    if (isShowcaseSignedManifestBrowserPath(new URL(page.url()).pathname)) {
      await expectMainHasNoHardFailureChrome(page);
      await page.goto(`/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    }

    await expect(page).toHaveURL(showcaseDemoReviewDetailUrlPattern());
    await expectMainHasNoHardFailureChrome(page);

    await page.goto(`/governance/sealed-records/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`);
    await expect(
      getAppMain(page).getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });

    await page.goto(
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent("sensitive-data-minimization-risk")}`,
    );
    await expectMainHasNoHardFailureChrome(page);

    await page.goto("/showcase/customer-intake-modernization");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expectMainHasNoHardFailureChrome(page);

    await page.goto("/insights/ask-review-questions");
    await expectMainHasNoHardFailureChrome(page);

    await page.goto("/help");
    await expectMainHasNoHardFailureChrome(page);
  });

  test("advanced-route smoke — ask graph compare governance advisory replay search policy packs load @demo-readiness", async ({
    page,
  }) => {
    const routes = [
      "/insights/ask-review-questions",
      "/insights/evidence-graph",
      "/insights/compare-two-reviews",
      "/governance/approval-queue",
      "/governance/advisory-scans",
      "/internal/validate-route",
      "/insights/search-review-evidence",
      "/governance/policy-packs",
    ] as const;

    for (const path of routes) {
      await page.goto(path);

      if (path === "/insights/evidence-graph") {
        await expectGraphPageReadySurface(page, { timeout: 25_000 });
      }

      await expectMainHasNoHardFailureChrome(page);
    }
  });

  test("policy pack scoped route renders pack shell (not governance workflow page heading) @demo-readiness", async ({
    page,
  }) => {
    await page.goto("/governance/policy-packs/e2e-policy-pack-001");
    // Pack detail body uses buyer-polished empty-state copy; breadcrumb uses demo fixture titles — not `getRouteTitle`'s "Policy pack detail".
    await expect(
      page.getByRole("main").getByRole("link", { name: /Open policy pack library|Policy pack library|Policy packs|registry catalog/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /^Governance workflow$/i })).toHaveCount(0);
  });

  test("invalid manifest and run route tokens surface branded not-found @demo-readiness", async ({ page }) => {
    await page.goto("/governance/sealed-records/undefined");
    await expectBrandedNotFoundSurface(page);

    await page.goto("/architecture/reviews/undefined");
    await expectBrandedNotFoundSurface(page);
  });
});
