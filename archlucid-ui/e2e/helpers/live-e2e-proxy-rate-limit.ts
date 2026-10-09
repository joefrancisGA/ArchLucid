/**
 * Live Playwright boots Next standalone with NODE_ENV=production, which enables the
 * in-process UI proxy limiter (default 120 req/min/IP). Serial private-beta smoke from
 * one CI IP exceeds that buyer-facing cap; keep a finite burst limit instead of disabling it.
 */
export const LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT = "2000";

export function resolveLiveE2eProxyRateLimitPerMinute(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw = env.ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE?.trim();

  if (raw !== undefined && raw.length > 0) {
    return raw;
  }

  return LIVE_E2E_PROXY_RATE_LIMIT_PER_MINUTE_DEFAULT;
}
