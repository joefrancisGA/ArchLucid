import type { Metadata } from "next";

/**

 * Legacy `/quick-start` is a redirect shim — not a discoverable marketing product page (TB-1818).

 */

export const LEGACY_QUICK_START_ROUTE_METADATA: Metadata = {

  title: "Redirecting to get started",

  description: "Legacy /quick-start bookmark — redirects immediately to the canonical get-started route.",

  robots: { index: false, follow: false },

};

