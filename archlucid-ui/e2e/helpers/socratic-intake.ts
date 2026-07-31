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

function isDraftAdmitResponse(response: { url: () => string; request: () => { method: () => string } }): boolean {
  const url = response.url();

  return (
    url.includes("/api/proxy/v1/architecture/draft/")
    && url.includes("/admit")
    && response.request().method() === "POST"
  );
}

async function delayAfterRateLimitedAdmitResponse(
  response: { headers: () => Record<string, string> },
): Promise<void> {
  const headers = response.headers();
  const retryAfterRaw = headers["retry-after"] ?? headers["Retry-After"];
  const seconds = retryAfterRaw ? Number.parseInt(String(retryAfterRaw).trim(), 10) : Number.NaN;
  const ms =
    Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 60_000) : 2_500;

  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clicks guided-intake admit with 429 backoff — extended-matrix shards share one API process. */
export async function clickSocraticAdmitWithRetry(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 180_000;
  const admitButton = page.getByTestId("socratic-admit");

  await expect(admitButton).toBeEnabled({ timeout: 15_000 });

  await expect
    .poll(
      async () => {
        const admitResponsePromise = page.waitForResponse(isDraftAdmitResponse, { timeout: 90_000 });

        await admitButton.click();

        const admitResponse = await admitResponsePromise;

        if (admitResponse.ok()) {
          return true;
        }

        if (admitResponse.status() === 429) {
          await delayAfterRateLimitedAdmitResponse(admitResponse);
          return false;
        }

        throw new Error(
          `draft admit failed ${admitResponse.status()}: ${(await admitResponse.text()).slice(0, 400)}`,
        );
      },
      { timeout: timeoutMs, intervals: [250, 500, 1000, 2000] },
    )
    .toBe(true);
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

        if (skipResponse.status() === 429) {
          // Live matrix can trip per-route windows; wait and let poll retry instead of failing the suite.
          const retryAfterHeader = skipResponse.headers()["retry-after"];
          const retryAfterSec = Number.parseInt(retryAfterHeader ?? "", 10);
          const waitMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
            ? Math.min(retryAfterSec * 1000, 60_000)
            : 5_000;

          await page.waitForTimeout(waitMs);

          return false;
        }

        if (!skipResponse.ok()) {
          if (skipResponse.status() === 429) {
            // Extended-matrix shards share one API — backoff and let expect.poll retry.
            await page.waitForTimeout(2_000);
            return false;
          }

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
