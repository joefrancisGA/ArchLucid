import type { Metadata } from "next";

/**
 * Legacy `/onboarding/start` is a redirect shim — not a discoverable onboarding start page (TB-1802).
 */
export const LEGACY_ONBOARDING_START_ROUTE_METADATA: Metadata = {
  title: "Redirecting to onboarding",
  description: "Legacy /onboarding/start bookmark — redirects immediately to the canonical onboarding hub.",
  robots: { index: false, follow: false },
};
