import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

import {
  expectBaselineWizardSystemNamePrefilled,
  waitForReviewsNewBaselineSimplifiedWizard,
} from "./helpers/reviews-new-baseline-wizard";
import { expandWizardBaselineZipEvidence } from "./helpers/wizard-baseline-zip-evidence";

function archLucidZipBuffer(manifest: Record<string, unknown>): Buffer {
  return Buffer.from(
    zipSync({
      "manifest.json": strToU8(JSON.stringify(manifest)),
      "resources.json": strToU8("[]"),
    }),
  );
}

test.describe("Azure extractor ZIP wizard field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/architecture/reviews/new?baseline=1", { waitUntil: "domcontentloaded" });
    await waitForReviewsNewBaselineSimplifiedWizard(page);
    await expect(page.getByRole("textbox", { name: "System name" })).not.toHaveValue("", { timeout: 15_000 });

    const description = page.getByRole("textbox", { name: "Description" });
    const descriptionText = (await description.inputValue()).trim();

    if (descriptionText.length < 10) {
      await description.fill(
        "Ten char min: assess this architecture for security, cost, and governance before production rollout.",
      );
    }

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 2 of 4/i, {
      timeout: 30_000,
    });
    await expandWizardBaselineZipEvidence(page);
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

    await expect(page.getByTestId("wizard-baseline-step-1-heading")).toBeVisible();
    await page.getByTestId("wizard-baseline-zip-field-input").setInputFiles(zipFile);

    await expect(page.getByTestId("wizard-azure-zip-error")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("wizard-azure-zip-schema-warning")).toHaveCount(0);
    await expect(page.getByTestId("wizard-azure-zip-ready")).toBeVisible({ timeout: 15_000 });

    await expectBaselineWizardSystemNamePrefilled(page, "E2eMockRg");
  });

  test("rejects non-zip file types", async ({ page }) => {
    const textFile = {
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a zip"),
    };

    await page.getByTestId("wizard-baseline-zip-field-input").setInputFiles(textFile);

    await expect(page.getByTestId("wizard-azure-zip-error")).toContainText(/\.zip/i, { timeout: 15_000 });
  });

  test("rejects ZIP without manifest.json", async ({ page }) => {
    const zipFile = {
      name: "invalid-no-manifest.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(zipSync({ "readme.txt": strToU8("not a packager zip") })),
    };

    await page.getByTestId("wizard-baseline-zip-field-input").setInputFiles(zipFile);

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

    await page.getByTestId("wizard-baseline-zip-field-input").setInputFiles(zipFile);

    await expect(page.getByTestId("wizard-azure-zip-error")).toContainText(
      /Unsupported manifest schemaVersion/i,
      { timeout: 15_000 },
    );
    await expect(page.getByTestId("wizard-azure-zip-schema-warning")).toHaveCount(0);
  });

  test("Try with Demo Data loads bundled demo ZIP", async ({ page }) => {
    await expect(page.getByTestId("wizard-azure-zip-try-demo")).toBeVisible();
    await page.getByTestId("wizard-azure-zip-try-demo").click();

    await expect(page.getByTestId("wizard-azure-zip-error")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("wizard-azure-zip-schema-warning")).toHaveCount(0);

    await expectBaselineWizardSystemNamePrefilled(page, "ClaimsIntakeRg");
  });
});
