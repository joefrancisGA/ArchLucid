import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

import { waitForReviewsNewBaselineSimplifiedWizard } from "./helpers/reviews-new-baseline-wizard";

function inventoryZipBuffer(manifest: Record<string, unknown>): Buffer {
  return Buffer.from(
    zipSync({
      "manifest.json": strToU8(JSON.stringify(manifest)),
      "resources.json": strToU8("[]"),
    }),
  );
}

test.describe("Wizard Tier-1 inventory evidence upload", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/architecture/reviews/new?baseline=1", { waitUntil: "domcontentloaded" });
    await waitForReviewsNewBaselineSimplifiedWizard(page);
  });

  test("AWS inventory source accepts validated ZIP on evidence step", async ({ page }) => {
    const evidenceStep = page.getByTestId("wizard-evidence-upload-step");

    if (!(await evidenceStep.isVisible())) {
      test.skip(true, "Full wizard evidence step not on this path");
    }

    await page.getByTestId("wizard-evidence-source-aws-inventory").click();
    await expect(page.getByTestId("tier1-inventory-upload-panel-aws")).toBeVisible();

    const zipFile = {
      name: "aws-inventory.zip",
      mimeType: "application/zip",
      buffer: inventoryZipBuffer({
        schemaVersion: 1,
        scriptVersion: "1.0.0",
        collectionTimestamp: "2026-06-25T12:00:00.000Z",
        cloudProvider: "Aws",
        accountId: "123456789012",
        scope: "account",
      }),
    };

    await page.getByTestId("wizard-evidence-upload-dropzone-input").setInputFiles(zipFile);

    await expect(page.getByTestId("wizard-evidence-upload-selected")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("wizard-evidence-inventory-zip-error")).toHaveCount(0);
  });
});
