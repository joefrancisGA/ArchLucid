import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { WHY_HERO_PRODUCT_SCREENSHOT_FILENAME } from "@/lib/why-page-copy";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator/operator-home-recent-reviews-heading";
import { getAppMain } from "./helpers/app-main";
import { assertPageFreeOfScreenshotDemoFailures } from "./screenshot-demo-quality-gates";
import { publicDirUnderUi } from "./screenshot-output-helpers";

test.describe.configure({ mode: "serial", timeout: 120_000 });

test.describe("capture why hero operator home screenshot @tb-2301", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("writes marketing why hero PNG from Claims Intake Demo operator Home", async ({ page }) => {
    await page.goto("/", { waitUntil: "load", timeout: 90_000 });
    await assertPageFreeOfScreenshotDemoFailures(page, "/");
    await expect(page.getByRole("heading", { name: OPERATOR_HOME_RECENT_REVIEWS_HEADING, level: 2 })).toBeVisible({ timeout: 60_000 });
    const outputDir = publicDirUnderUi("marketing", "why");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, WHY_HERO_PRODUCT_SCREENSHOT_FILENAME);
    await getAppMain(page).screenshot({ path: outputPath, animations: "disabled", caret: "hide" });
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(10_000);
  });
});
