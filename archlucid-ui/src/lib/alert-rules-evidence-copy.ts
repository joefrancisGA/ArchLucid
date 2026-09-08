import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { GOVERNANCE_ALERTS_PATH, GOVERNANCE_ALERT_RULES_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERT_RULES_CANONICAL_PATH = GOVERNANCE_ALERT_RULES_PATH;

export const ALERT_RULES_CLAIM_DISCIPLINE =
  "Alert conditions, destinations, and simulations set when and where workspace alerts fire — not proof for auditors on their own. Open the Alert inbox or Audit when you need activity records.";

export const ALERT_RULES_FOLLOW_UPS_TITLE = "Where to go next";

export const ALERT_RULES_SOURCES_INTRO =
  "Use these follow-ups when alert setup needs inbox triage, delivery channels, or product orientation.";


/** Operator Sources — no self-href to the default alert-rules hub path. */
export const ALERT_RULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert rules hub", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Alert inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Conditions tab", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Notifications tab", href: governanceAlertRulesTabHref("notifications") },
  { label: "Advanced rules tab", href: governanceAlertRulesTabHref("advanced-rules") },
  { label: "Test alerts tab", href: governanceAlertRulesTabHref("test-alerts") },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

const ALERT_RULES_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  GOVERNANCE_ALERT_RULES_PATH,
  governanceAlertRulesTabHref("notifications"),
  governanceAlertRulesTabHref("test-alerts"),
]);

/** Hub orientation Sources — excludes self-href and in-tab destinations (SAX). */
export const ALERT_RULES_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = ALERT_RULES_SOURCES.filter(
  (source) => !ALERT_RULES_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
