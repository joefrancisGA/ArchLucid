import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { getAppMain } from "./helpers/app-main";
import { publicDirUnderUi } from "./screenshot-output-helpers";

const ROUTES: ReadonlyArray<{ readonly slug: string; readonly href: string }> = [
  { slug: "help-security-evidence-paths", href: "/help/security-evidence-paths" },
  { slug: "architecture-findings", href: "/architecture/architectures/customer-intake/findings" },
];

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe("capture archlucid-ui-rate route fixes", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  for (const route of ROUTES) {
    test(`writes ${route.slug}.png`, async ({ page }) => {
      await page.goto(route.href, { waitUntil: "load", timeout: 90_000 });
      if (route.slug === "help-security-evidence-paths") {
        await expect(page.getByTestId("help-security-evidence-paths-guide")).toBeVisible({ timeout: 60_000 });
      } else {
        await expect(page.getByTestId("working-architecture-nested-tool-shell")).toBeVisible({ timeout: 60_000 });
      }
      const outputDir = publicDirUnderUi("screenshots", "archlucid-ui-rate");
      fs.mkdirSync(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `${route.slug}.png`);
      await getAppMain(page).screenshot({ path: outputPath, animations: "disabled", caret: "hide" });
      expect(fs.existsSync(outputPath)).toBe(true);
      expect(fs.statSync(outputPath).size).toBeGreaterThan(10_000);
    });
  }
});
