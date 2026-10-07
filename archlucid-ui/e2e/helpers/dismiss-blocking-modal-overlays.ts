import { expect, type Locator, type Page } from "@playwright/test";

import { dismissFirstSessionPurposeChooserIfVisible } from "./live-seat-scope-assertions";

/** Radix Dialog / AlertDialog backdrop that intercepts pointer events when left open. */
const BLOCKING_MODAL_OVERLAY =
  'div.fixed.inset-0.z-50.bg-neutral-900\\/50[data-state="open"]';

/** Best-effort dismissal of stray Radix modal layers. Returns true when no blocking overlay remains. */
export async function dismissBlockingModalOverlays(page: Page): Promise<boolean> {
  // Close-without-choice on the first-session chooser does not persist; it reopens and eats clicks.
  await dismissFirstSessionPurposeChooserIfVisible(page);

  const overlay = page.locator(BLOCKING_MODAL_OVERLAY);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if ((await overlay.count()) === 0) {
      return true;
    }

    await dismissFirstSessionPurposeChooserIfVisible(page);

    const openDialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));

    if (await openDialog.first().isVisible().catch(() => false)) {
      const cancel = openDialog
        .first()
        .getByRole("button", { name: /cancel|close|dismiss|skip for now|done/i })
        .first();

      if (await cancel.isVisible().catch(() => false)) {
        await cancel.click({ timeout: 5_000 }).catch(() => undefined);
      }
    }

    await page.keyboard.press("Escape").catch(() => undefined);
    await expect(overlay).toHaveCount(0, { timeout: 5_000 }).catch(() => undefined);
  }

  return (await overlay.count()) === 0;
}

/** Clicks through a stuck Radix backdrop when normal Playwright clicking is intercepted. */
export async function clickThroughBlockingOverlays(
  page: Page,
  target: Locator,
  options?: { force?: boolean },
): Promise<void> {
  await dismissBlockingModalOverlays(page);

  try {
    await target.click({ timeout: 15_000, force: options?.force });
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!/intercepts pointer events/i.test(message)) {
      throw error;
    }
  }

  await dismissBlockingModalOverlays(page);
  await target.click({ timeout: 15_000, force: true });
}

/** Opens a dialog from a control without Escaping after the click (which would close the new dialog). */
export async function clickControlThatOpensDialog(
  page: Page,
  target: Locator,
  dialog: Locator,
): Promise<void> {
  await dismissBlockingModalOverlays(page);
  // A closing Radix backdrop still intercepts hits after data-state leaves "open"; force-click
  // skips Playwright's actionability check and can land on that overlay instead of the control.
  await target.click({ timeout: 15_000 });
  await dialog.waitFor({ state: "visible", timeout: 15_000 });
}
