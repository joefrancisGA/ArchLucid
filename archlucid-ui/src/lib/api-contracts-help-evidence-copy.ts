import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const API_CONTRACTS_HELP_CANONICAL_PATH = API_CONTRACTS_HELP_PATH;

export const API_CONTRACTS_HELP_CLAIM_DISCIPLINE =
  "API contracts reference documents HTTP endpoints, auth, and versioning — not buyer approval workflows or a signed audit export. Open Approval or Audit trail when you need workflow or activity records.";

export const API_CONTRACTS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const API_CONTRACTS_HELP_SOURCES_INTRO =
  "Use these follow-ups when integrators need CLI usage, engineering troubleshooting, audit records, or admin diagnostics — not HTTP contract text.";

export const API_CONTRACTS_HELP_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "integrators need CLI usage, engineering troubleshooting, audit records, or admin diagnostics instead of HTTP contract text",
);

/** Admin Sources — no self-href to this technical reference. */
export const API_CONTRACTS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "CLI usage", href: inAppHelpHref("cli-usage") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Admin diagnostics", href: inAppHelpHref("admin-diagnostics") },
] as const;

const API_CONTRACTS_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([API_CONTRACTS_HELP_CANONICAL_PATH]);

/** Admin orientation Sources — excludes self-href to `/help/api-contracts` (HG). */
export const API_CONTRACTS_HELP_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = API_CONTRACTS_HELP_SOURCES.filter(
  (source) => !API_CONTRACTS_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
