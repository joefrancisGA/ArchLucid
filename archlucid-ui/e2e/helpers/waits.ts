import { expect, type Page } from "@playwright/test";

import { getAppMain } from "./app-main";

/** Wait for the operator shell and initial document load before feature-specific assertions. */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await expect(getAppMain(page)).toBeVisible({ timeout: 60_000 });
}
