import type { Locator } from "@playwright/test";

/** Passes when any candidate locator is visible — avoids Playwright strict-mode failures from `.or()` chains. */
export async function expectAnyLocatorVisible(
  locators: readonly Locator[],
  timeout = 15_000,
): Promise<void> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const locator of locators) {
      if (await locator.first().isVisible().catch(() => false)) {
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("None of the expected readiness locators became visible");
}
