import { expect, type Page } from "@playwright/test";

/**
 * Baseline-first wizard step 2 keeps the ZIP drop zone inside the optional "Advanced evidence (Azure)"
 * collapsible — expand it before interacting with `wizard-baseline-zip-field*`.
 */
export async function expandWizardBaselineZipEvidence(page: Page): Promise<void> {
  const toggle = page.getByTestId("wizard-azure-advanced-toggle");

  if ((await toggle.count()) > 0) {
    const expanded = await toggle.getAttribute("aria-expanded");

    if (expanded !== "true") {
      await toggle.click();
    }
  }

  await expect(page.getByTestId("wizard-baseline-zip-field")).toBeVisible({ timeout: 30_000 });
}
