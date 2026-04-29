/**
 * **Next.js:** `process.env.NEXT_PUBLIC_*` is inlined at build time — safe to read from client bundles.
 */
export function isNextPublicDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}
