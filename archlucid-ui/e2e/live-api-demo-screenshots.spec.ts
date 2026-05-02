/**
 * Live API + SQL: capture demo-safe PNGs under repo `artifacts/screenshots/<timestamp>/` with preflight gates.
 *
 * Run: `npm run screenshots:demo` (from `archlucid-ui`) with UI + API already up, or rely on default
 * `playwright.config.ts` webServer (build + API bootstrap).
 */
import { expect, test } from "@playwright/test";

import * as fs from "node:fs";

import {
  collectFailureSubstringsInText,
  DEMO_SCREENSHOT_ROUTES,
  demoScreenshotsOutputDir,
  runDemoScreenshotPreflight,
  routeToScreenshotFilename,
  settleDemoRoute,
  waitForShellReady,
  writeDemoScreenshotsReports,
  type DemoScreenshotsReport,
  type RouteCaptureResult,
} from "./helpers/demo-screenshots-harness";
import { liveApiBase } from "./helpers/live-api-client";

test.use({
  viewport: { width: 1440, height: 1200 },
});

test.describe("live-api-demo-screenshots", () => {
  test("preflight, capture demo routes, write reports", async ({ page, request }, testInfo) => {
    test.setTimeout(900_000);

    const uiBaseUrl =
      (typeof testInfo.project.use.baseURL === "string" && testInfo.project.use.baseURL.length > 0
        ? testInfo.project.use.baseURL
        : null) ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000";

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outDir = demoScreenshotsOutputDir(stamp);

    const preflight = await runDemoScreenshotPreflight(request, uiBaseUrl);
    const routes: RouteCaptureResult[] = [];

    if (!preflight.ok) {
      const earlyReport: DemoScreenshotsReport = {
        generatedAtUtc: new Date().toISOString(),
        uiBaseUrl,
        apiBaseUrl: liveApiBase,
        viewport: { width: 1440, height: 1200 },
        preflight: {
          ok: preflight.ok,
          checks: preflight.checks,
          alertsDemoReady: preflight.alertsDemoReady,
          alertCount: preflight.alertCount,
        },
        routes: [],
        exitFailedRouteCount: 1,
      };

      writeDemoScreenshotsReports(outDir, earlyReport);
      expect(preflight.ok, `Preflight failed — see ${outDir}/report.md`).toBe(true);
    }

    fs.mkdirSync(outDir, { recursive: true });

    for (const routePath of DEMO_SCREENSHOT_ROUTES) {
      if (routePath.startsWith("/alerts") && !preflight.alertsDemoReady) {
        routes.push({
          route: routePath,
          path: routePath,
          screenshotFile: null,
          status: "skipped",
          issues: ["Alerts inbox not demo-ready — API returned zero alerts."],
        });
        continue;
      }

      const filename = routeToScreenshotFilename(routePath);

      try {
        await page.goto(routePath, { waitUntil: "load", timeout: 120_000 });
        await waitForShellReady(page, 120_000);
        await settleDemoRoute(page, routePath);

        const bodyText = await page.locator("body").innerText();
        const issues = collectFailureSubstringsInText(bodyText);

        if (issues.length > 0) {
          routes.push({
            route: routePath,
            path: routePath,
            screenshotFile: null,
            status: "fail",
            issues,
          });
          continue;
        }

        const shotPath = `${outDir}/${filename}`;

        await page.screenshot({ path: shotPath, fullPage: true });
        routes.push({ route: routePath, path: routePath, screenshotFile: filename, status: "pass", issues: [] });
      } catch (e) {
        routes.push({
          route: routePath,
          path: routePath,
          screenshotFile: null,
          status: "fail",
          issues: [`exception: ${(e as Error).message}`],
        });
      }
    }

    const exitFailedRouteCount = routes.filter((r) => r.status === "fail").length;
    const report: DemoScreenshotsReport = {
      generatedAtUtc: new Date().toISOString(),
      uiBaseUrl,
      apiBaseUrl: liveApiBase,
      viewport: { width: 1440, height: 1200 },
      preflight: {
        ok: preflight.ok,
        checks: preflight.checks,
        alertsDemoReady: preflight.alertsDemoReady,
        alertCount: preflight.alertCount,
      },
      routes,
      exitFailedRouteCount,
    };

    writeDemoScreenshotsReports(outDir, report);
    expect(exitFailedRouteCount, `One or more demo routes failed — see ${outDir}/report.md`).toBe(0);
  });
});
