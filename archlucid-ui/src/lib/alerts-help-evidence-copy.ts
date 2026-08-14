import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERTS_PATH, GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const ALERTS_HELP_CANONICAL_PATH = "/help/alerts" as const;

export const ALERTS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const ALERTS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how notifications are raised and routed — open Alert rules, the alerts inbox, or Audit when you need live configuration or governed trails.";

export const ALERTS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ALERTS_HELP_CLAIM_HEADING_ID = "help-alerts-claim-discipline-heading" as const;

export const ALERTS_HELP_SOURCES_INTRO =
  "Use these follow-ups when you need live alert configuration, inbox triage, destinations, or product orientation.";

/** Operator Sources — no self-href to `/help/alerts`. */
export const ALERTS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alerts inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Alert rules", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
