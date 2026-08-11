import type { Metadata } from "next";

import {
  API_CONTRACTS_HELP_PAGE_SUBTITLE,
  API_CONTRACTS_HELP_PAGE_TITLE,
} from "@/lib/api-contracts-help-guide-content";

/**
 * Admin-gated API contracts technical reference — not buyer self-serve help.
 * `generateMetadata` intentionally returns a not-found title for internal-runbook slugs (TB-1384).
 */
export const API_CONTRACTS_HELP_ROUTE_METADATA: Metadata = {
  title: API_CONTRACTS_HELP_PAGE_TITLE,
  description: API_CONTRACTS_HELP_PAGE_SUBTITLE,
  robots: { index: false, follow: false },
};
