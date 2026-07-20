import { expect, type Page } from "@playwright/test";

/** Skips every pending MUST clarification until the guided-intake wizard enables review/submit. */
export async function skipAllSocraticClarificationsInUi(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 120_000;

  await expect(page.getByTestId("socratic-questions-done")).toBeVisible({ timeout: 60_000 });

  const showAllClarifications = page.getByRole("button", { name: /Show all \d+ clarifications/i });

  if (await showAllClarifications.isVisible().catch(() => false)) {
    await showAllClarifications.click();
  }

  await expect.poll(
    async () => {
      const doneButton = page.getByTestId("socratic-questions-done");

      if (await doneButton.isEnabled()) {
        return true;
      }

      const skipButtons = page.getByRole("button", { name: "Skip this clarification" });
      const skipCount = await skipButtons.count();

      if (skipCount === 0) {
        return false;
      }

      await skipButtons.first().click();

      return false;
    },
    { timeout: timeoutMs, intervals: [250, 500, 1000, 2000] },
  ).toBe(true);
}
