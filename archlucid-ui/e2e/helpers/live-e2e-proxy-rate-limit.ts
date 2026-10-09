/**
 * Live Playwright boots Next standalone with NODE_ENV=production, which enables the
 * in-process UI proxy limiter (default 120 req/min/IP). Serial private-beta smoke from
 * one CI IP exceeds that buyer-facing cap; keep a finite burst limit instead of disabling it.
 */
export const LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT = "2000";

/** Narrow env slice so Vitest fixtures are not forced to stub `NODE_ENV`. */
export type LiveE2eProxyRateLimitEnv = {
  readonly ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE?: string;
};

export function resolveLiveE2eProxyRateLimitPerMinute(
  env: LiveE2eProxyRateLimitEnv = {
    ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE: process.env.ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE,
  },
): string {
  const raw = env.ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE?.trim();

  if (raw !== undefined && raw.length > 0) {
    return raw;
  }

  return LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT;
}
