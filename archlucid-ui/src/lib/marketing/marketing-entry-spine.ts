/** TB-2236 — Canonical marketing try-it spine: one demo + one get-started entry. */

export const MARKETING_CANONICAL_DEMO_PATH = "/see-it" as const;

export const MARKETING_CANONICAL_GET_STARTED_PATH = "/get-started" as const;

/** Retired frictionless try bookmark — redirects to {@link MARKETING_CANONICAL_DEMO_PATH}. */
export const MARKETING_LEGACY_TRY_PATH = "/try" as const;

/** Retired guided walkthrough bookmark — redirects to {@link MARKETING_CANONICAL_DEMO_PATH}. */
export const MARKETING_LEGACY_LIVE_DEMO_PATH = "/live-demo" as const;

/** Retired Contoso preview bookmark — redirects to {@link MARKETING_CANONICAL_DEMO_PATH}. */
export const MARKETING_LEGACY_DEMO_PREVIEW_PATH = "/demo/preview" as const;

/** Competing try-it doors consolidated under TB-2236 (redirect-only; no competing page.tsx). */
export const MARKETING_RETIRED_TRY_IT_ENTRY_PATHS: readonly string[] = [
  MARKETING_LEGACY_TRY_PATH,
  MARKETING_LEGACY_LIVE_DEMO_PATH,
  MARKETING_LEGACY_DEMO_PREVIEW_PATH,
];
