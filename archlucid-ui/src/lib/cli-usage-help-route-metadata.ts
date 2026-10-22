import type { Metadata } from "next";

/**
 * Admin-gated CLI engineering runbook — not a customer help topic or marketing page.
 * Served from the authority-gated `/help/cli-usage` topic; retired `/internal/cli-usage` bookmarks 404.
 */
export const CLI_USAGE_HELP_ROUTE_METADATA: Metadata = {
  title: "CLI usage",
  description:
    "Non-interactive `archlucid` commands for proof packets, config lint, and support bundles.",
  robots: { index: false, follow: false },
};
