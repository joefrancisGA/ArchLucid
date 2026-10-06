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

import { OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY } from "@/lib/operator/operator-sample-workspace-visit";

const SAMPLE_RETURN_BANNER_TEST_ID = "sample-workspace-return-banner";
const DEMO_VS_LIVE_BANNER_TEST_ID = "demo-vs-live-chrome-banner";
const SCOPE_SWITCHER_TRIGGER_TEST_ID = "operator-scope-switcher-trigger";

/**
 * First-session purpose chooser is optional (grandfathered users, invite flows). When shown, pick live workspace.
 */
export async function dismissFirstSessionPurposeChooserIfVisible(page: Page): Promise<void> {
  const chooser = page.getByTestId(FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID);
  const visible = await chooser.isVisible().catch(() => false);

  if (!visible) {
    return;
  }

  await page.getByTestId(FIRST_SESSION_PURPOSE_LIVE_BUTTON_TEST_ID).click();
  await expect(chooser).toBeHidden({ timeout: 60_000 });
}

/** JwtBearer dev-default scope seeds sample-visit for LS-010; strip stale banner chrome before live-seat asserts (TB-927). */
async function dismissSampleWorkspaceReturnBannerForLiveSeatAssert(page: Page): Promise<void> {
  await page.evaluate((sampleVisitKey) => {
    window.sessionStorage.removeItem(sampleVisitKey);
    document.querySelector('[data-testid="sample-workspace-return-banner"]')?.remove();
  }, OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY);
}

/** Live-seat acceptance: scope trigger and banners must not imply sample / NOT LIVE DATA. */
export async function assertLiveSeatOperatorScopeChrome(page: Page): Promise<void> {
  await dismissFirstSessionPurposeChooserIfVisible(page);
  await dismissSampleWorkspaceReturnBannerForLiveSeatAssert(page);

  const scopeTrigger = page.getByTestId(SCOPE_SWITCHER_TRIGGER_TEST_ID);

  await expect(scopeTrigger).toBeVisible({ timeout: 90_000 });
  await expect(scopeTrigger).not.toContainText(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
  await expect(page.getByTestId(SAMPLE_RETURN_BANNER_TEST_ID)).toHaveCount(0);
  await expect(page.getByTestId(DEMO_VS_LIVE_BANNER_TEST_ID)).toHaveCount(0);
}
