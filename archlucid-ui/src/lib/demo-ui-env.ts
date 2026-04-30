/**
 * **Next.js:** `process.env.NEXT_PUBLIC_*` is inlined at build time — safe to read from client bundles.
 */
export function isNextPublicDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

/**
 * Marketing/demo pages: suppress raw fixture IDs, generated timestamps, and similar in banners when either public
 * demo mode or static-operator demo build is enabled.
 */
export function isBuyerSafeDemoMarketingChromeEnv(): boolean {
  return isNextPublicDemoMode() || process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true";
}
