import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const API_CONTRACTS_HELP_CLAIM_DISCIPLINE =
  "API contracts reference documents HTTP endpoints, auth, and versioning — not buyer approval workflows or a signed audit export. Open Approval or Audit trail when you need workflow or activity records.";

export const API_CONTRACTS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const API_CONTRACTS_HELP_SOURCES_INTRO =
  "Use these follow-ups when integrators need CLI usage, engineering troubleshooting, audit records, or admin diagnostics — not HTTP contract text.";

/** Admin Sources — no self-href to this technical reference. */
export const API_CONTRACTS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "CLI usage", href: inAppHelpHref("cli-usage") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Admin diagnostics", href: inAppHelpHref("admin-diagnostics") },
] as const;
