import { expect, type Page } from "@playwright/test";

/** Radix Dialog / AlertDialog backdrop that intercepts pointer events when left open. */
const BLOCKING_MODAL_OVERLAY =
  'div.fixed.inset-0.z-50.bg-neutral-900\\/50[data-state="open"]';

/** Closes stray Radix modal layers so Playwright clicks reach the intended control. */
export async function dismissBlockingModalOverlays(page: Page): Promise<void> {
  const overlay = page.locator(BLOCKING_MODAL_OVERLAY);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if ((await overlay.count()) === 0) {
      return;
    }

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

  if ((await overlay.count()) > 0) {
    throw new Error("Blocking modal overlay remained open after dismissal attempts.");
  }
}
