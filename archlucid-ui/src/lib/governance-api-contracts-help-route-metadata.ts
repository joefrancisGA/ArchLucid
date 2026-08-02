import type { Metadata } from "next";

/**
 * Admin-gated API contracts technical reference — not buyer self-serve help.
 * `generateMetadata` intentionally returns a not-found title for internal-runbook slugs (TB-1384).
 */
export const GOVERNANCE_API_CONTRACTS_HELP_ROUTE_METADATA: Metadata = {
  title: "Governance and API contracts (technical reference)",
  description:
    "Developer/Admin technical reference — versioned HTTP behavior, auth, governance endpoints, and OpenAPI as contract of record.",
  robots: { index: false, follow: false },
};
