/**
 * True when the UI is built for anonymous/public demo flows (marketing + operator sample data).
 * Pair with `NEXT_PUBLIC_DEMO_STATIC_OPERATOR` when the deploy must serve curated payloads without a live API.
 */
export function isPublicDemoModeEnv(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

/**
 * Marketing chrome may advertise `/live-demo` only when this is set alongside a configured demo API base.
 * Avoids linking to a route that often 404s when the host exposes an API URL without the sample-run endpoint.
 */
export function isMarketingLiveDemoLinkEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MARKETING_LIVE_DEMO === "true";
}
