import type { Locator, Page } from "@playwright/test";

/** Primary page content landmark (`AppShellClient` / operator shell `#main-content`). */
export function getAppMain(page: Page): Locator {
  return page.locator("#main-content");
}
