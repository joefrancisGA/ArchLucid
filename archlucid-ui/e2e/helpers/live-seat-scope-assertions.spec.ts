import { expect, test } from "@playwright/test";

import { clickThroughBlockingOverlays } from "./dismiss-blocking-modal-overlays";
import {
  FIRST_SESSION_PURPOSE_CHOOSER_APPEARANCE_TIMEOUT_MS,
  ensureFirstSessionPurposeChooserClosed,
} from "./live-seat-scope-assertions";

test("delayed first-session chooser does not block the wizard advance", async ({ page }) => {
  await page.setContent(`
    <button data-testid="wizard-next" type="button">Next</button>
    <div data-testid="first-session-purpose-chooser" hidden>
      <button data-testid="first-session-purpose-live" type="button" disabled>Start in my workspace</button>
    </div>
    <div class="fixed inset-0 z-50 bg-neutral-900/50" data-state="closed"></div>
  `);

  const next = page.getByTestId("wizard-next");
  let nextClicks = 0;

  await next.evaluate((element) => {
    element.addEventListener("click", () => {
      element.setAttribute("data-clicked", "true");
    });
  });

  await page.evaluate(() => {
    window.setTimeout(() => {
      const chooser = document.querySelector<HTMLElement>('[data-testid="first-session-purpose-chooser"]');
      const liveButton = document.querySelector<HTMLButtonElement>('[data-testid="first-session-purpose-live"]');
      const overlay = document.querySelector<HTMLElement>("div.fixed.inset-0.z-50");

      if (chooser === null || liveButton === null || overlay === null) {
        return;
      }

      chooser.hidden = false;
      liveButton.disabled = false;
      overlay.dataset.state = "open";
      liveButton.addEventListener(
        "click",
        () => {
          chooser.hidden = true;
          overlay.dataset.state = "closed";
        },
        { once: true },
      );
    }, 100);
  });

  await ensureFirstSessionPurposeChooserClosed(page, 2_000);
  await clickThroughBlockingOverlays(page, next);

  nextClicks += await next.evaluate((element) => (element.getAttribute("data-clicked") === "true" ? 1 : 0));

  expect(nextClicks).toBe(1);
  await expect(page.locator('div.fixed.inset-0.z-50[data-state="open"]')).toHaveCount(0);
});

test("absent first-session chooser does not consume the full dismiss budget", async ({ page }) => {
  test.setTimeout(90_000);

  await page.setContent(`
    <main>
      <button data-testid="operator-scope-switcher-trigger" type="button">Workspace</button>
    </main>
  `);

  const startedMs = Date.now();

  await ensureFirstSessionPurposeChooserClosed(page, 60_000);

  const elapsedMs = Date.now() - startedMs;

  expect(elapsedMs).toBeLessThan(FIRST_SESSION_PURPOSE_CHOOSER_APPEARANCE_TIMEOUT_MS + 5_000);
});
