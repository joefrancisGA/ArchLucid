/**
 * Incremental static regeneration for public marketing pages with no session data.
 * Parity with `/see-it` and `/showcase/[runId]` (PERF-08 / TB-567).
 *
 * Route modules must use `export const revalidate = 300` inline — Next.js does not honor re-exports.
 */
export const MARKETING_ISR_REVALIDATE_SECONDS = 300;

/** Canonical ISR window for unit tests and fetch `next.revalidate` call sites. */
export const revalidate = MARKETING_ISR_REVALIDATE_SECONDS;
