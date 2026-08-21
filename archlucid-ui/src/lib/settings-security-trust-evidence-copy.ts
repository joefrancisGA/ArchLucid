import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const SETTINGS_SECURITY_TRUST_CANONICAL_PATH = SETTINGS_SECURITY_TRUST_PATH;

export const SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL = "How security and trust settings work" as const;

export const SETTINGS_SECURITY_TRUST_CLAIM_DISCIPLINE =
  "This page lists security and trust materials for your workspace — architect orientation only. It is not an audit export bundle, a CPA-issued SOC 2 report, or a published third-party pen-test report. Open Assurance status, Trust Center, or Audit when you need live assurance pages or activity records.";

export const SETTINGS_SECURITY_TRUST_SOURCES_INTRO =
  "Use these follow-ups when you need public assurance pages, isolation details, or audit activity.";


/** Operator Sources — no self-href to settings security-trust. */
export const SETTINGS_SECURITY_TRUST_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
