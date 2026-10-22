/**
 * GTM M-105 — axe WCAG 2.2 AA (critical/serious) on founder acceptance routes
 * against ACCEPTANCE_BASE_URL (complements mock chromium-accessibility + live-api-accessibility).
 */
import { expect, test, type Page } from "@playwright/test";

import { axeLiveE2eDisableRuleIdsNow } from "./axe-rule-allowlist";
import { formatViolations, runAxe } from "./helpers/axe-helper";
import { founderAcceptanceRoutes } from "./helpers/founder-acceptance-routes";
import { shouldIncludeFounderAuthenticatedRoutes } from "./helpers/founder-include-authenticated-routes";

const routes = founderAcceptanceRoutes({
  includeAuthenticated: shouldIncludeFounderAuthenticatedRoutes(),
});


async function expectNoCriticalOrSeriousAxeViolations(page: Page, path: string): Promise<void> {
  // Light + reduced-motion: CI runners often prefer dark, and marketing-reveal-in starts at
  // opacity 0 (fill-mode both) which makes axe color-contrast fail mid-entrance.
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("archlucid_color_mode", "light");
    } catch {
      // ignore quota / private-mode failures
    }

    document.documentElement.classList.remove("dark");
  });

  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible({ timeout: 60_000 });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));

  const results = await runAxe(page, { disableRules: axeLiveE2eDisableRuleIdsNow() });
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

  expect(critical, formatViolations(critical)).toHaveLength(0);
}

test.describe("founder axe a11y against chosen URL", { tag: ["@founder"] }, () => {
  for (const route of routes) {
    test(`${route.name} (${route.path}) has no critical or serious axe violations`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await expectNoCriticalOrSeriousAxeViolations(page, route.path);
    });
  }
});
