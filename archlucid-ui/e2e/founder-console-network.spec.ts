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
    test("founder routes stay free of unexpected pageerrors, console errors, failed XHR, and HTTP 5xx", async ({
      page,
    }) => {
      test.setTimeout(Math.max(120_000, routes.length * 45_000));

      const capture = attachFounderPageGuards(page);

      for (const route of routes) {
        await test.step(route.name, async () => {
          const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

          // Soft navigation readiness — do not fail the whole suite on a single 404 marketing slug.
          if (response && response.status() >= 500) {
            expect(response.status(), `${route.path} returned HTTP ${response.status()}`).toBeLessThan(500);
          }

          await expect(page.locator("body")).toBeVisible({ timeout: 60_000 });
          // Let in-flight XHR settle so requestfailed / 5xx listeners observe late errors.
          await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
        });
      }

      assertFounderPageGuardsClean(capture);
    });
  },
);
