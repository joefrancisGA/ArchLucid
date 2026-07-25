import { expect, type Page } from "@playwright/test";

async function expandAllClarificationsIfCollapsed(page: Page): Promise<void> {
  const viewAll = page.getByTestId("socratic-view-all-clarifications");

  if (!(await viewAll.isVisible().catch(() => false))) {
    return;
  }

  const label = ((await viewAll.innerText()) ?? "").trim();

  if (/Show all/i.test(label)) {
    await viewAll.click();
  }
}

/** Skips every pending MUST clarification until the guided-intake wizard enables review/submit. */
export async function skipAllSocraticClarificationsInUi(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 120_000;

  await expect(page.getByTestId("socratic-questions-done")).toBeVisible({ timeout: 60_000 });
  await expandAllClarificationsIfCollapsed(page);

  await expect
    .poll(
      async () => {
        const doneButton = page.getByTestId("socratic-questions-done");

        if (await doneButton.isEnabled()) {
          return true;
        }

        const doneText = ((await doneButton.textContent()) ?? "").trim();

        // Skip/save in flight — wait for the next clarification to render.
        if (/Saving/i.test(doneText)) {
          return false;
        }

        await expandAllClarificationsIfCollapsed(page);

        const skipButtons = page.getByRole("button", { name: /Skip this clarification/i });
        const skipCount = await skipButtons.count();

        if (skipCount === 0) {
          return false;
        }

        await skipButtons.first().click();

        return false;
      },
      { timeout: timeoutMs, intervals: [250, 500, 1000, 2000] },
    )
    .toBe(true);
}
