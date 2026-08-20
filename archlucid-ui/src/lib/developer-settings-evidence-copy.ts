import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const DEVELOPER_SETTINGS_CANONICAL_PATH = "/administration/developer" as const;

export const INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE = "Internal developer tools" as const;

export const DEVELOPER_SETTINGS_CLAIM_DISCIPLINE =
  "This Internal developer tools page is a diagnostic surface for theme evaluation and CLI demos — not a full audit export. Open System health, Engineering troubleshooting, or Audit for live checks or official records.";

export const DEVELOPER_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when theme or CLI experiments turn into engineering runbooks, system health checks, or activity records.";


/** Operator Sources - no self-href to `/administration/developer`. */
export const DEVELOPER_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "CLI usage help", href: inAppHelpHref("cli-usage") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting") },
  { label: "Admin diagnostics help", href: inAppHelpHref("admin-diagnostics") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
