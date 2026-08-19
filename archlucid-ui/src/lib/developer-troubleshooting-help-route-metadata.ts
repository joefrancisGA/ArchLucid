import type { Metadata } from "next";

/**
 * Admin-gated engineering runbook — not a customer help topic or marketing page.
 * `generateMetadata` intentionally returns a not-found title for internal-runbook slugs (TB-1246).
 */
export const DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA: Metadata = {
  title: "Engineering troubleshooting runbook",
  description:
    "CLI commands, environment variables, log patterns, and deep failure signatures for engineering support.",
  robots: { index: false, follow: false },
};
