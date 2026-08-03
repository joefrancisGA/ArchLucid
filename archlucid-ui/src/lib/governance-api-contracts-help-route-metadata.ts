import type { Metadata } from "next";

import {
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_SUBTITLE,
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE,
} from "@/lib/governance-api-contracts-help-guide-content";

/**
 * Admin-gated API contracts technical reference — not buyer self-serve help.
 * `generateMetadata` intentionally returns a not-found title for internal-runbook slugs (TB-1384).
 */
export const GOVERNANCE_API_CONTRACTS_HELP_ROUTE_METADATA: Metadata = {
  title: GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE,
  description: GOVERNANCE_API_CONTRACTS_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
