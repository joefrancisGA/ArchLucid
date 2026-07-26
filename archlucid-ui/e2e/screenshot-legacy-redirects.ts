import type { Page } from "@playwright/test";

/** Legacy bookmark paths → URL pattern after HTTP or App Router redirect (see next.config.ts + page.tsx shims). */
export const SCREENSHOT_LEGACY_REDIRECT_URL_PATTERNS: Readonly<Record<string, RegExp>> = {
  "/advisory": /\/governance\/advisory-scans(?:\?[^#]*)?(?:$|#)/,
  "/advisory-scheduling": /\/governance\/advisory-scans\?tab=schedules(?:&[^#]*)?(?:$|#)/,
  "/settings/exec-digest": /\/digests\?tab=schedule(?:&[^#]*)?(?:$|#)/,
  "/digest-subscriptions": /\/digests\?tab=subscriptions(?:&[^#]*)?(?:$|#)/,
  "/audit": /\/governance\/audit(?:\?|$|#)/,
  // Bare `/alerts` inbox bookmark → `/governance/alerts` (tab deep-links may land on alert-rules; see next.config.ts).
  "/alerts": /\/governance\/(?:alerts|alert-rules)(?:\?|$|#)/,
  "/governance-resolution": /\/governance\/resolution(?:\?|$|#)/,
};

/** Demo run alias slugs normalize to canonical showcase ids (see demo-run-alias-path-redirect.ts). */
const DEMO_RUN_ALIAS_CANONICAL_PATTERN =
  /\/reviews\/claims-intake-modernization(?:\/|$|\?|#)/;

/**
 * Wait until navigation settles on the canonical URL for legacy shims and `/runs` → `/reviews` renames.
 * Uses `load`/`commit` friendly checks so standalone Next does not race App Router `redirect()`.
 */
export async function waitForScreenshotLegacyRedirects(page: Page, href: string): Promise<void> {
  const pathOnly = href.split("?", 1)[0] ?? href;
  const legacyPattern = SCREENSHOT_LEGACY_REDIRECT_URL_PATTERNS[pathOnly];

  if (legacyPattern !== undefined) {
    await page.waitForURL(legacyPattern, { timeout: 60_000, waitUntil: "commit" });
  }

  if (pathOnly === "/runs" || pathOnly.startsWith("/runs/")) {
    await page.waitForURL(/\/reviews(?:\/|\?|$|#)/, { timeout: 60_000, waitUntil: "commit" });
  }

  if (pathOnly.startsWith("/runs/claims-intake-modernization-run") || pathOnly.startsWith("/reviews/claims-intake-modernization-run")) {
    await page.waitForURL(DEMO_RUN_ALIAS_CANONICAL_PATTERN, { timeout: 60_000, waitUntil: "commit" });
  }
}

/** Path + query from the live document URL — use for post-redirect screenshot quality gates. */
export function screenshotEffectiveHref(pageUrl: string): string {
  const parsed = new URL(pageUrl);

  return `${parsed.pathname}${parsed.search}`;
}
