import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERTS_HELP_CANONICAL_PATH = "/help/alerts" as const;

export const ALERTS_HELP_CLAIM_DISCIPLINE =
  "This alerts guide explains how notifications are raised and routed — it is not a signed-review diligence Sources package. Open Alert rules, the alerts inbox, or Audit when you need live configuration or governed trails.";

export const ALERTS_HELP_SOURCES_INTRO =
  "Use these follow-ups when you need live alert configuration, inbox triage, destinations, or product orientation.";


/** Operator Sources — no self-href to `/help/alerts`. */
export const ALERTS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alerts inbox", href: "/governance/alerts" },
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Audit", href: "/governance/audit" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
