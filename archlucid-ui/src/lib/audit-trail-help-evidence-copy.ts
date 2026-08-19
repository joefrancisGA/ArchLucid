import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUDIT_TRAIL_HELP_CANONICAL_PATH = "/help/audit-trail" as const;

export const AUDIT_TRAIL_HELP_TOPIC_LABEL = "How the audit trail works" as const;

export const AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE =
  "This guide explains how immutable events and correlation identifiers support governance review — open Audit, Findings, or Assurance status when you need live trails or assurance surfaces.";

export const AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const AUDIT_TRAIL_HELP_CLAIM_HEADING_ID = "help-audit-trail-claim-discipline-heading" as const;

export const AUDIT_TRAIL_HELP_SOURCES_INTRO =
  "Use these follow-ups when audit vocabulary turns into live activity, findings triage, approvals, or assurance orientation.";

/** Operator Sources — no self-href to `/help/audit-trail`. */
export const AUDIT_TRAIL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Governance approval", href: inAppHelpHref("governance-approval") },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
