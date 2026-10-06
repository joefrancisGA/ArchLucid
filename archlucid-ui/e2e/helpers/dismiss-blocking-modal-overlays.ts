import { expect, type Locator, type Page } from "@playwright/test";

/** Radix Dialog / AlertDialog backdrop that intercepts pointer events when left open. */
const BLOCKING_MODAL_OVERLAY =
  'div.fixed.inset-0.z-50.bg-neutral-900\\/50[data-state="open"]';

const DISMISS_DIALOG_BUTTON =
  /cancel|close|dismiss|skip for now|done|got it|ok|continue|not now|maybe later/i;

/** Best-effort dismissal of stray Radix modal layers. Returns true when no blocking overlay remains. */
export async function dismissBlockingModalOverlays(page: Page): Promise<boolean> {
  const overlay = page.locator(BLOCKING_MODAL_OVERLAY);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if ((await overlay.count()) === 0) {
      return true;
    }

    const openDialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));

    if (await openDialog.first().isVisible().catch(() => false)) {
      const dismissAction = openDialog.first().getByRole("button", { name: DISMISS_DIALOG_BUTTON }).first();

      if (await dismissAction.isVisible().catch(() => false)) {
        await dismissAction.click({ timeout: 5_000 }).catch(() => undefined);
      }
    }

    await overlay
      .first()
      .click({ position: { x: 8, y: 8 }, force: true, timeout: 3_000 })
      .catch(() => undefined);

    await page.keyboard.press("Escape").catch(() => undefined);
    await expect(overlay).toHaveCount(0, { timeout: 5_000 }).catch(() => undefined);
  }

  if ((await overlay.count()) > 0) {
    await removeStuckRadixModalOverlays(page);
  }

  return (await overlay.count()) === 0;
}

/** Last-resort E2E cleanup when Radix leaves an open backdrop without a visible dialog. */
export async function removeStuckRadixModalOverlays(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('div.fixed.inset-0.z-50[data-state="open"]')) {
      element.remove();
    }

    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");
  });
}

/** Clicks through a stuck Radix backdrop when normal Playwright clicking is intercepted. */
export async function clickThroughBlockingOverlays(
  page: Page,
  target: Locator,
  options?: { force?: boolean },
): Promise<void> {
  await dismissBlockingModalOverlays(page);

  try {
    await target.scrollIntoViewIfNeeded();
    await target.click({ timeout: 15_000, force: options?.force });
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!/intercepts pointer events|outside of the viewport/i.test(message)) {
      throw error;
    }
  }

  await dismissBlockingModalOverlays(page);
  await target.scrollIntoViewIfNeeded();
  await target.click({ timeout: 15_000, force: true });
}
