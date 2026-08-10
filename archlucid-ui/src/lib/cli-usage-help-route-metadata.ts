import type { Metadata } from "next";

/**
 * Admin-gated CLI engineering runbook — not a customer help topic or marketing page.
 * Served from `/internal/cli-usage`; retired `/help/cli-usage` bookmarks redirect here.
 */
export const CLI_USAGE_HELP_ROUTE_METADATA: Metadata = {
  title: "CLI usage",
  description:
    "Non-interactive `archlucid` commands for proof packets, config lint, and support bundles.",
  robots: { index: false, follow: false },
};
