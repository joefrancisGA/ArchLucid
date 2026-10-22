import type { Page } from "@playwright/test";

/**
 * Remaining rename redirects that screenshot harness may still hit.
 * Pre-release bookmark shims (advisory, digests, settings alerts, etc.) were retired.
 */
export const SCREENSHOT_LEGACY_REDIRECT_URL_PATTERNS: Readonly<Record<string, RegExp>> = {
  "/audit": /\/governance\/audit(?:\?|$|#)/,
  "/alerts": /\/governance\/alerts(?:\?|$|#)/,
  "/alert-rules": /\/governance\/alert-rules(?:\?|$|#)/,
  "/policy-packs": /\/governance\/policy-packs(?:\?|$|#)/,
};

/** Demo run alias slugs normalize to canonical showcase ids (see demo-run-alias-path-redirect.ts). */
const DEMO_RUN_ALIAS_CANONICAL_PATTERN =
  /\/(?:architecture\/)?reviews\/claims-intake-modernization(?:\/|$|\?|#)/;

/**
 * Wait until navigation settles on the canonical URL for remaining rename redirects and `/runs` → reviews.
 */
export async function waitForScreenshotLegacyRedirects(page: Page, href: string): Promise<void> {
  const pathOnly = href.split("?", 1)[0] ?? href;
  const legacyPattern = SCREENSHOT_LEGACY_REDIRECT_URL_PATTERNS[pathOnly];

  if (legacyPattern !== undefined) {
    await page.waitForURL(legacyPattern, { timeout: 60_000, waitUntil: "commit" });
  }

  if (pathOnly === "/runs" || pathOnly.startsWith("/runs/")) {
    await page.waitForURL(/\/(?:architecture\/)?reviews(?:\/|\?|$|#)/, { timeout: 60_000, waitUntil: "commit" });
  }

  if (
    pathOnly.startsWith("/runs/claims-intake-modernization-run")
    || pathOnly.startsWith("/architecture/reviews/claims-intake-modernization-run")
    || pathOnly.startsWith("/architecture/reviews/claims-intake-modernization-run")
  ) {
    await page.waitForURL(DEMO_RUN_ALIAS_CANONICAL_PATTERN, { timeout: 60_000, waitUntil: "commit" });
  }
}

/** Path + query from the live document URL — use for post-redirect screenshot quality gates. */
export function screenshotEffectiveHref(pageUrl: string): string {
  const parsed = new URL(pageUrl);

  return `${parsed.pathname}${parsed.search}`;
}
