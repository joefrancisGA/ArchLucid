import type { Metadata } from "next";

/**
 * Legacy `/snapshot/[runId]` is a redirect shim — not a discoverable product page (TB-1951).
 */
export const LEGACY_SNAPSHOT_ROUTE_METADATA: Metadata = {
  title: "Redirecting to read-only review",
  description:
    "Legacy /snapshot bookmark — redirects immediately to the canonical review workspace with readOnly=1.",
  robots: { index: false, follow: false },
};
