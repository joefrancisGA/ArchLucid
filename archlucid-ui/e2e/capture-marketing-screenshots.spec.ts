import { expect, test } from "@playwright/test";

import { registerOperatorJourneyApiRoutes } from "./helpers/register-operator-api-routes";
import { FIXTURE_MANIFEST_ID, FIXTURE_RUN_ID, fixtureRunDetail, fixtureManifestSummary } from "./fixtures";

const OUT = "public/marketing/screenshots";

test.describe("marketing screenshots (mock API)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("writes PNGs under public/marketing/screenshots", async ({ page }) => {
    await registerOperatorJourneyApiRoutes(page, {
      runDetail: { runId: FIXTURE_RUN_ID, body: fixtureRunDetail() },
      manifestSummary: { manifestId: FIXTURE_MANIFEST_ID, body: fixtureManifestSummary() },
    });

    const shots: { file: string; href: string }[] = [
      { file: `${OUT}/01-home.png`, href: "/" },
      { file: `${OUT}/02-runs-list.png`, href: "/runs?projectId=default" },
      { file: `${OUT}/03-runs-new.png`, href: "/runs/new" },
      { file: `${OUT}/04-run-detail.png`, href: `/runs/${encodeURIComponent(FIXTURE_RUN_ID)}` },
      { file: `${OUT}/05-compare.png`, href: "/compare" },
      { file: `${OUT}/06-graph.png`, href: "/graph" },
      { file: `${OUT}/07-audit.png`, href: "/audit" },
      { file: `${OUT}/08-alerts.png`, href: "/alerts" },
    ];

    for (const s of shots) {
      await page.goto(s.href);
      await expect(page.locator("body")).toBeVisible({ timeout: 120_000 });
      await page.screenshot({ path: s.file, fullPage: true });
    }
  });
});
