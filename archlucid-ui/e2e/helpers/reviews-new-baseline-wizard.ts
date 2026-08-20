import { expect, type Page } from "@playwright/test";

import { waitForAppReady } from "./waits";

/** Full guided wizard (`wizard-start-blank`) only mounts when mode is "full" — quick start hides the preset step. */
export async function ensureFullGuidedWizardMode(page: Page): Promise<void> {
  const modeToggle = page.getByTestId("new-run-wizard-mode-toggle");
  const allStepsButton = modeToggle.getByRole("button", { name: /All steps/i });

  if (await modeToggle.isVisible().catch(() => false)) {
    if ((await allStepsButton.getAttribute("aria-pressed")) !== "true") {
      await allStepsButton.click();
      await expect(allStepsButton).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
    }
  } else {
    const advancedOptIn = page.getByTestId("new-run-wizard-advanced-opt-in");
    const showAllButton = advancedOptIn.getByRole("button", { name: /Show all wizard steps/i });

    if (await showAllButton.isVisible().catch(() => false)) {
      await showAllButton.click();
    }
  }

  // Always wait for the full-mode preset CTA — toggle alone is not enough when the shell is still settling.
  await expect(page.getByTestId("wizard-start-blank")).toBeVisible({ timeout: 60_000 });
}

/** `/architecture/reviews/new?baseline=1` opens the simplified pilot wizard inside the path switcher. */
export async function waitForReviewsNewBaselineSimplifiedWizard(page: Page): Promise<void> {
  await waitForAppReady(page);
  await expect(page.getByTestId("reviews-new-path-switcher")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("simplified-pilot-wizard")).toBeVisible({ timeout: 60_000 });
}

/** ZIP upload prefills identity fields while the wizard stays on the evidence step — go back to verify. */
export async function expectBaselineWizardSystemNamePrefilled(page: Page, expected: string): Promise<void> {
  const systemName = page.getByRole("textbox", { name: "System Name" });

  if (!(await systemName.isVisible().catch(() => false))) {
    const backButton = page.getByTestId("simplified-pilot-footer").getByRole("button", { name: /^Back$/i });
    await expect(backButton).toBeVisible({ timeout: 15_000 });
    await backButton.click();
  }

  await expect(systemName).toBeVisible({ timeout: 15_000 });
  await expect(systemName).toHaveValue(expected, { timeout: 15_000 });
}
