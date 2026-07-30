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

function isDraftSkipResponse(response: { url: () => string; request: () => { method: () => string } }): boolean {
  const url = response.url();

  return (
    url.includes("/api/proxy/v1/architecture/draft/")
    && url.includes("/skip")
    && response.request().method() === "POST"
  );
}

/** Waits until admit advances the wizard onto the clarifications step (step 1). */
export async function waitForSocraticClarificationsStep(page: Page, timeoutMs = 90_000): Promise<void> {
  await expect
    .poll(
      async () => {
        if (await page.getByTestId("socratic-questions-done").isVisible().catch(() => false)) {
          return true;
        }

        if (await page.getByTestId("socratic-clarification-helper").isVisible().catch(() => false)) {
          return true;
        }

        if (await page.getByTestId("socratic-skip-clarification").first().isVisible().catch(() => false)) {
          return true;
        }

        // Admission / API failure surfaces — fail fast with readable context.
        const problem = page.locator('[data-testid="socratic-intake-wizard"] [role="alert"]').first();

        if (await problem.isVisible().catch(() => false)) {
          const text = ((await problem.innerText()) ?? "").trim();
          throw new Error(`Guided intake did not reach clarifications: ${text.slice(0, 400)}`);
        }

        return false;
      },
      { timeout: timeoutMs, intervals: [250, 500, 1000, 2000] },
    )
    .toBe(true);

  await expect(page.getByTestId("socratic-questions-done")).toBeVisible({ timeout: 30_000 });
}

/** Skips every pending MUST clarification until the guided-intake wizard enables review/submit. */
export async function skipAllSocraticClarificationsInUi(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  // Live API+SQL under extended-matrix load: each skip is a round trip; keep headroom above 120s.
  const timeoutMs = options?.timeoutMs ?? 180_000;

  await waitForSocraticClarificationsStep(page, Math.min(timeoutMs, 90_000));
  await expandAllClarificationsIfCollapsed(page);

  await expect
    .poll(
      async () => {
        const doneButton = page.getByTestId("socratic-questions-done");

        await expect(doneButton).toBeVisible({ timeout: 5_000 });

        if (await doneButton.isEnabled()) {
          return true;
        }

        const doneText = ((await doneButton.textContent()) ?? "").trim();

        // Skip/save in flight — wait for the next clarification to render.
        if (/Saving/i.test(doneText)) {
          return false;
        }

        await expandAllClarificationsIfCollapsed(page);

        const skipButtons = page.getByTestId("socratic-skip-clarification");
        const skipCount = await skipButtons.count();

        if (skipCount === 0) {
          // No pending clarifications left in the DOM — Review answers should enable once busy clears.
          const hint = page.getByTestId("socratic-review-answers-hint");

          if (await hint.isVisible().catch(() => false)) {
            const hintText = ((await hint.innerText()) ?? "").trim();
            throw new Error(
              `Review answers still blocked with no skip controls visible: ${hintText.slice(0, 200)}`,
            );
          }

          return false;
        }

        const firstSkip = skipButtons.first();

        if (!(await firstSkip.isEnabled())) {
          return false;
        }

        const skipResponsePromise = page.waitForResponse(isDraftSkipResponse, { timeout: 60_000 });

        await firstSkip.click();

        const skipResponse = await skipResponsePromise;

        if (!skipResponse.ok()) {
          throw new Error(
            `Skip clarification failed ${skipResponse.status()}: ${(await skipResponse.text()).slice(0, 400)}`,
          );
        }

        return false;
      },
      { timeout: timeoutMs, intervals: [250, 500, 1000, 2000] },
    )
    .toBe(true);
}
