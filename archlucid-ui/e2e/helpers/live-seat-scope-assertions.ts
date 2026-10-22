/**
 * LS-018 Playwright scope chrome for live-seat invite / first-login paths.
 * Asserts operator shell is on a live workspace seat — not Customer Intake Demo sample chrome.
 */
import { expect, type Page } from "@playwright/test";

import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import {
  FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID,
  FIRST_SESSION_PURPOSE_LIVE_BUTTON_TEST_ID,
} from "@/lib/auth/first-session-purpose-copy";

const SAMPLE_RETURN_BANNER_TEST_ID = "sample-workspace-return-banner";
const DEMO_VS_LIVE_BANNER_TEST_ID = "demo-vs-live-chrome-banner";
const SCOPE_SWITCHER_TRIGGER_TEST_ID = "operator-scope-switcher-trigger";
const BLOCKING_MODAL_OVERLAY = 'div.fixed.inset-0.z-50.bg-neutral-900\\/50[data-state="open"]';

/**
 * `timeoutMs` on ensureFirstSessionPurposeChooserClosed is the dismiss budget.
 * Waiting that long for the optional chooser to appear (it often never does — preferences already
 * set, grandfathered, or a later test in the same worker) burns the 120s session-expiry smokes.
 */
export const FIRST_SESSION_PURPOSE_CHOOSER_APPEARANCE_TIMEOUT_MS = 10_000;

/**
 * First-session purpose chooser is optional (grandfathered users, invite flows). When shown, pick live workspace.
 * Closing it without choosing live does not persist the preference, so it reopens and blocks clicks.
 */
export async function ensureFirstSessionPurposeChooserClosed(page: Page, timeoutMs = 2_000): Promise<void> {
  const chooser = page.getByTestId(FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID);
  const appearanceTimeoutMs = Math.min(timeoutMs, FIRST_SESSION_PURPOSE_CHOOSER_APPEARANCE_TIMEOUT_MS);

  await chooser.waitFor({ state: "visible", timeout: appearanceTimeoutMs }).catch(() => undefined);

  await expect(async () => {
    if (await chooser.isVisible().catch(() => false)) {
      const liveButton = page.getByTestId(FIRST_SESSION_PURPOSE_LIVE_BUTTON_TEST_ID);
      await expect(liveButton).toBeEnabled({ timeout: 5_000 });
      await liveButton.click({ timeout: 15_000 });
    }

    await expect(chooser).toBeHidden({ timeout: 5_000 });
    await expect(page.locator(BLOCKING_MODAL_OVERLAY)).toHaveCount(0, { timeout: 5_000 });
  }).toPass({ timeout: timeoutMs, intervals: [500, 1_000, 2_000] });
}

export async function dismissFirstSessionPurposeChooserIfVisible(page: Page): Promise<void> {
  await ensureFirstSessionPurposeChooserClosed(page);
}

/** Preferences load after the first operator navigation; wait briefly then pick live if the chooser appears. */
export async function waitAndDismissFirstSessionPurposeChooser(
  page: Page,
  timeoutMs = 60_000,
): Promise<void> {
  await ensureFirstSessionPurposeChooserClosed(page, timeoutMs);
}

/** Live-seat acceptance: scope trigger and banners must not imply sample / NOT LIVE DATA. */
export async function assertLiveSeatOperatorScopeChrome(page: Page): Promise<void> {
  await ensureFirstSessionPurposeChooserClosed(page, 60_000);

  const scopeTrigger = page.getByTestId(SCOPE_SWITCHER_TRIGGER_TEST_ID);

  await expect(scopeTrigger).toBeVisible({ timeout: 90_000 });
  await expect(scopeTrigger).not.toContainText(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
  await expect(page.getByTestId(SAMPLE_RETURN_BANNER_TEST_ID)).toHaveCount(0);
  await expect(page.getByTestId(DEMO_VS_LIVE_BANNER_TEST_ID)).toHaveCount(0);
}
