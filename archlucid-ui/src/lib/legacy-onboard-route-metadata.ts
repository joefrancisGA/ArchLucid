import type { Metadata } from "next";

/**
 * Legacy `/onboard` is a redirect shim — not a discoverable onboarding product page (TB-1797).
 */
export const LEGACY_ONBOARD_ROUTE_METADATA: Metadata = {
  title: "Redirecting to onboarding",
  description:
    "Legacy /onboard bookmark — redirects immediately to the canonical first review guide (/architecture/first-review-guide).",
  robots: { index: false, follow: false },
};
