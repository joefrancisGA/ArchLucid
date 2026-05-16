import { expect, test } from "@playwright/test";

import {
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
  SCREENSHOT_RUN_ID,
  SHOWCASE_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "./fixtures";
import { escapeRegExpSource } from "./helpers/escape-reg-exp-source";

const claimsShowcasePath = "/showcase/claims-intake-modernization";

/**
 * Marketing showcase QuickNav (`ShowcaseQuickNav`) uses "Open manifest"; review-trail cards use "Manifest";
 * operator runs table still uses "Finalized manifest". Proof-chain tests accept any stable deep-link label.
 */
const SHOWCASE_MANIFEST_DEEP_LINK = /^(?:Open manifest|Manifest|Finalized manifest)$/i;

/** Canonical run detail path is `/reviews/{runId}`; `/runs/*` permanently redirects (see `next.config.ts`). */
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
    await expect(page.getByTestId("branded-not-found")).toBeVisible();
  });

  test("runs list shows Claims Intake example without mock-provider leakage", async ({ page }) => {
    await page.goto("/reviews?projectId=default");
    await expect(page.getByRole("heading", { name: /architecture reviews/i })).toBeVisible();
    await expect(page.getByText(/Claims Intake Modernization/i).first()).toBeVisible();
    await expect(page.getByText(/mock API/i)).toHaveCount(0);
  });

  test("run detail avoids not-found shells, bogus pipeline progress, and invalid dates", async ({ page }) => {
    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    const primaryMain = page.getByRole("main").first();
    await expect(primaryMain).not.toContainText(/run not found/i);
    await expect(primaryMain).not.toContainText(/request failed/i);
    await expect(primaryMain).not.toContainText(/Invalid Date/i);
    await expect(primaryMain.getByText(/\b0 of 4 run pipeline stages complete\b/i)).toHaveCount(0);

    await page.goto(`/reviews/${encodeURIComponent(SCREENSHOT_RUN_ID)}`);
    await expect(page).toHaveURL(showcaseDemoReviewDetailUrlPattern());
    await expect(page.getByRole("main").first()).not.toContainText(/run not found/i);
  });

  test("showcase-aligned manifest UUID loads manifest chrome (not indefinite skeleton)", async ({ page }) => {
    await page.goto(`/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`);
    await expect(page.getByRole("heading", { name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN, level: 1 })).toBeVisible();
    const primaryMain = page.getByRole("main");
    await expect(primaryMain).toHaveCount(1);
    await expect(primaryMain).not.toContainText(/manifest summary could not be loaded/i);
    await expect(primaryMain).not.toContainText(/request failed/i);
  });

  test("marketing showcase exposes working deep links into operator proof pages", async ({ page }) => {
    await page.goto(claimsShowcasePath);
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
      /completed architecture output|Completed example/i,
    );

    await page.getByRole("link", { name: /Review package/i }).first().click();
    await expect(page).toHaveURL(showcaseDemoReviewDetailUrlPattern());
    await expect(page.getByRole("main").first()).not.toContainText(/Invalid Date/i);

    await page.goto(claimsShowcasePath);
    await page.getByRole("link", { name: SHOWCASE_MANIFEST_DEEP_LINK }).first().click();
    await expect(page).toHaveURL(
      new RegExp(
        `(?:/manifests/${escapeRegExpSource(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}|/reviews/${escapeRegExpSource(SHOWCASE_DEMO_RUN_ID)}/manifest)`,
      ),
    );
    await expect(page.getByRole("heading", { name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN, level: 1 })).toBeVisible();
  });

  test("demo pages do not leak internal tokens in main content @demo-readiness", async ({ page }) => {
    const paths: string[] = [
      "/",
      "/reviews?projectId=default",
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`,
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/manifest`,
      "/governance",
      "/help",
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent("phi-minimization-risk")}`,
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
      /golden manifest/i,
      /\blegacy\b/i,
      /Execute\+/,
      /Development workspace/i,
    ];

    for (const path of paths) {
      await page.goto(path);
      const mainText = await page.getByRole("main").first().innerText();

      for (const pattern of banned) {
        expect(mainText, `Unexpected token on ${path}`).not.toMatch(pattern);
      }
    }
  });

  test("core demo smoke — home, new request, runs, run detail, manifest, finding, showcase @demo-readiness", async ({
    page,
  }) => {
    await page.goto("/");
    /** Mock E2E uses buyer-polished demo: `/reviews/new` is de-emphasized (golden path is the showcase package). */
    await expect(
      page
        .getByRole("main")
        .first()
        .getByRole("heading", { name: /Claims Intake Modernization Review Package/i }),
    ).toBeVisible();

    await page.goto("/reviews/new");
    await expect(page).toHaveURL(/\/reviews\/new/);

    await page.goto("/reviews?projectId=default");
    await expect(page.getByRole("heading", { name: /architecture reviews/i })).toBeVisible();
    // Buyer-polished table rows expose two Action links ("View review package", "View signed manifest");
    // target the primary explore link via stable test id (Playwright strict mode).
    const claimsTableRow = page
      .getByRole("main")
      .first()
      .getByTestId(`runs-row-${SHOWCASE_DEMO_RUN_ID}`)
      .first();
    await expect(claimsTableRow).toBeVisible();
    await claimsTableRow
      .getByTestId(`runs-row-primary-explore-${SHOWCASE_DEMO_RUN_ID}`)
      .click();
    const afterListClickUrl = new RegExp(
      `(?:/manifests/${escapeRegExpSource(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}|/reviews/${escapeRegExpSource(SHOWCASE_DEMO_RUN_ID)}/manifest|/(?:reviews|runs)/${escapeRegExpSource(SHOWCASE_DEMO_RUN_ID)})`,
    );
    await expect(page).toHaveURL(afterListClickUrl);

    if (page.url().includes("/manifests/") || page.url().includes("/manifest")) {
      await expect(page.getByRole("main").first()).not.toContainText(/request failed/i);
      await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    }

    await expect(page).toHaveURL(showcaseDemoReviewDetailUrlPattern());
    await expect(page.getByRole("main").first()).not.toContainText(/request failed/i);

    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/manifest`);
    await expect(page.getByRole("heading", { name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN, level: 1 })).toBeVisible();

    await page.goto(
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent("phi-minimization-risk")}`,
    );
    await expect(page.getByRole("main").first()).not.toContainText(/request failed/i);

    await page.goto("/showcase/claims-intake-modernization");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("main").first()).not.toContainText(/request failed/i);

    await page.goto("/ask");
    await expect(page.getByRole("main").first()).not.toContainText(/request failed/i);

    await page.goto("/help");
    await expect(page.getByRole("main").first()).not.toContainText(/request failed/i);
  });

  test("advanced-route smoke — ask graph compare governance advisory replay search policy packs load @demo-readiness", async ({
    page,
  }) => {
    const routes = [
      "/ask",
      "/graph",
      "/compare",
      "/governance",
      "/advisory",
      "/replay",
      "/search",
      "/policy-packs",
    ] as const;

    for (const path of routes) {
      await page.goto(path);

      if (path === "/graph") {
        await expect(
          page.getByTestId("graph-canvas-ready").or(page.getByRole("button", { name: /^Load graph$/i })),
        ).toBeVisible({ timeout: 25_000 });
      }

      await expect(page.getByRole("main").first()).not.toContainText(/request failed/i);
    }
  });

  test("policy pack scoped route renders pack shell (not governance workflow page heading) @demo-readiness", async ({
    page,
  }) => {
    await page.goto("/governance/policy-packs/e2e-policy-pack-001");
    // Pack detail body uses buyer-polished empty-state copy; breadcrumb uses demo fixture titles — not `getRouteTitle`'s "Policy pack detail".
    await expect(page.getByRole("link", { name: /^Open Policy packs$/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /^Governance workflow$/i })).toHaveCount(0);
  });

  test("invalid manifest and run route tokens surface branded not-found @demo-readiness", async ({ page }) => {
    await page.goto("/manifests/undefined");
    await expect(page.getByTestId("branded-not-found")).toBeVisible();

    await page.goto("/reviews/undefined");
    await expect(page.getByTestId("branded-not-found")).toBeVisible();
  });
});
