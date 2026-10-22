import type { Locator, Page } from "@playwright/test";

/** Primary page content landmark (`AppShellClient` / operator shell `#main-content`). */
export function getAppMain(page: Page): Locator {
  // `.first()` avoids strict-mode failures when a chrome-mode transition briefly leaves two `<main>` nodes in DOM.
  return page.locator("#main-content").first();
}
