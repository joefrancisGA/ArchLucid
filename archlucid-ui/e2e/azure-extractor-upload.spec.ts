import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

function archLucidZipBuffer(manifest: Record<string, unknown>): Buffer {
  return Buffer.from(zipSync({ "manifest.json": strToU8(JSON.stringify(manifest)) }));
}

test.describe("Azure extractor ZIP wizard field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reviews/new?baseline=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("simplified-pilot-wizard")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("wizard-baseline-zip-field")).toBeVisible();
  });

  test("accepts a valid packager ZIP and prefills system name", async ({ page }) => {
    const zipFile = {
      name: "valid-azure-pack.zip",
      mimeType: "application/zip",
      buffer: archLucidZipBuffer({
        schemaVersion: 1,
        scriptVersion: "0.2.0",
        collectionTimestamp: "2026-05-21T12:00:00.000Z",
        subscriptionId: "11111111-1111-1111-1111-111111111111",
        scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/E2eMockRg",
      }),
    };

    await page.getByTestId("wizard-baseline-zip-field").getByLabel("Azure packager ZIP file").setInputFiles(zipFile);

    await expect(page.getByTestId("wizard-azure-zip-error")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("wizard-azure-zip-schema-warning")).toHaveCount(0);

    await page.getByRole("button", { name: /^(Continue|Next)$/ }).click();
    await expect(page.getByRole("textbox", { name: "System name" })).toHaveValue("E2eMockRg", {
      timeout: 15_000,
    });
  });

  test("rejects ZIP without manifest.json", async ({ page }) => {
    const zipFile = {
      name: "invalid-no-manifest.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(zipSync({ "readme.txt": strToU8("not a packager zip") })),
    };

    await page.getByTestId("wizard-baseline-zip-field").getByLabel("Azure packager ZIP file").setInputFiles(zipFile);

    await expect(page.getByTestId("wizard-azure-zip-error")).toContainText(/manifest\.json/i, { timeout: 15_000 });
  });

  test("warns when manifest schemaVersion is unsupported", async ({ page }) => {
    const zipFile = {
      name: "legacy-schema.zip",
      mimeType: "application/zip",
      buffer: archLucidZipBuffer({
        schemaVersion: 99,
        scriptVersion: "0.1.0",
        collectionTimestamp: "2020-01-01T00:00:00.000Z",
        subscriptionId: "11111111-1111-1111-1111-111111111111",
        scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/LegacyRg",
      }),
    };

    await page.getByTestId("wizard-baseline-zip-field").getByLabel("Azure packager ZIP file").setInputFiles(zipFile);

    await expect(page.getByTestId("wizard-azure-zip-error")).toContainText(
      /Unsupported schema version/i,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId("wizard-azure-zip-schema-warning")).toHaveCount(0);
  });

  test("Try with Sample Data loads bundled sample ZIP", async ({ page }) => {
    await expect(page.getByTestId("wizard-azure-zip-try-sample")).toBeVisible();
    await page.getByTestId("wizard-azure-zip-try-sample").click();

    await expect(page.getByTestId("wizard-azure-zip-error")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("wizard-azure-zip-schema-warning")).toHaveCount(0);

    await page.getByRole("button", { name: /^(Continue|Next)$/ }).click();
    await expect(page.getByRole("textbox", { name: "System name" })).toHaveValue("SampleRg", {
      timeout: 15_000,
    });
  });
});
