import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.SECURENOW_BASE_URL ?? "http://127.0.0.1:3001";
const href = "/infrastructure/extract-upload";
const outputDir = path.join(uiRoot, "public", "screenshots", "securenow-ui-rate");
const outputPath = path.join(outputDir, "infrastructure-extract-upload.png");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.context().addCookies([
  {
    name: "archlucid_product_line_v1",
    value: "security",
    url: baseUrl,
    sameSite: "Lax",
  },
]);

await page.addInitScript(() => {
  localStorage.setItem("archlucid_has_seen_onboarding", "true");
  localStorage.setItem("archlucid_onboarding_tour_completed", "1");
  localStorage.setItem("archlucid_nav_show_extended", "false");
  localStorage.setItem("archlucid_nav_show_advanced", "false");
  localStorage.setItem("archlucid_nav_show_administration", "0");
  localStorage.setItem("archlucid-nav-expanded", "false");
  localStorage.setItem("archlucid_sidebar_recent_activity_open", "0");
  localStorage.setItem("archlucid_operate_nav_unlock", "0");
});

await page.route("**/api/**", async (route) => {
  const url = route.request().url();

  if (url.includes("workspace-baseline-artifacts")) {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ hasBaselineArtifacts: false, extractorScriptVersion: "1.0.0" }),
    });
    return;
  }

  if (url.includes("Get-SecureNowAzurePackage.ps1") || url.includes("Get-ArchLucidAzurePackage.ps1")) {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: '$scriptVersion = "1.0.0"',
    });
    return;
  }

  await route.continue();
});

await page.goto(`${baseUrl}${href}`, { waitUntil: "load", timeout: 120_000 });

await page
  .locator('[data-testid="extract-upload-settings-page"]')
  .waitFor({ state: "visible", timeout: 90_000 });

await page.getByTestId("archlucid-wordmark-link").waitFor({ state: "visible", timeout: 60_000 });

const landedPath = new URL(page.url()).pathname;
if (landedPath !== href) {
  throw new Error(`Expected ${href} but landed on ${landedPath}`);
}

const mainText = await page.locator('[data-testid="extract-upload-settings-page"]').innerText();
if (mainText.trim().length < 80) {
  throw new Error(`Page body too short (${mainText.trim().length} chars); capture likely blank or gated.`);
}

fs.mkdirSync(outputDir, { recursive: true });
await page.screenshot({ path: outputPath, fullPage: true, animations: "disabled", caret: "hide" });

const stat = fs.statSync(outputPath);
console.log(JSON.stringify({ outputPath, bytes: stat.size, url: page.url() }, null, 2));

await browser.close();
