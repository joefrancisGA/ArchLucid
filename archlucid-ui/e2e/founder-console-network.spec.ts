/**
 * GTM M-104 — fail on unexpected pageerror / console.error / failed XHR / HTTP 5xx
 * while walking founder acceptance routes against ACCEPTANCE_BASE_URL.
 */
import { expect, test } from "@playwright/test";

import {
  attachFounderPageGuards,
  assertFounderPageGuardsClean,
} from "./helpers/attach-founder-page-guards";
import { founderAcceptanceRoutes } from "./helpers/founder-acceptance-routes";
import { shouldIncludeFounderAuthenticatedRoutes } from "./helpers/founder-include-authenticated-routes";

const routes = founderAcceptanceRoutes({
  includeAuthenticated: shouldIncludeFounderAuthenticatedRoutes(),
});

test.describe(
  "founder console + network guards",
  { tag: ["@founder", "@critical"] },
  () => {
    for (const route of routes) {
      test(`${route.path} has no unexpected console or network errors`, async ({ page }) => {
        test.setTimeout(120_000);
        const capture = attachFounderPageGuards(page);
        const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

        // Soft navigation readiness — a single 404 does not fail the generic guard.
        if (response && response.status() >= 500) {
          expect(response.status(), `${route.path} returned HTTP ${response.status()}`).toBeLessThan(500);
        }

        await expect(page.locator("body")).toBeVisible({ timeout: 60_000 });
        if (route.path === "/welcome" || route.path === "/pricing") {
          expect(response?.ok()).toBe(true);
          await expect(page.getByTestId("pricing-tier-architect")).toBeVisible({ timeout: 60_000 });
          await expect(page.getByTestId("pricing-tier-team")).toBeVisible();
        }

        // Give listeners a chance to observe late failures after rendering.
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
        assertFounderPageGuardsClean(capture);
      });
    }
  },
);
