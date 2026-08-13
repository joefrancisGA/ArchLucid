import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { GOVERNANCE_ALERTS_PATH, GOVERNANCE_ALERT_RULES_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERT_RULES_CANONICAL_PATH = GOVERNANCE_ALERT_RULES_PATH;

export const ALERT_RULES_CLAIM_DISCIPLINE =
  "Alert conditions, destinations, and simulations configure when and where workspace alerts fire — they are not a signed-review diligence Sources package. Open the Alert inbox or Audit when you need a governed trail.";

export const ALERT_RULES_SOURCES_INTRO =
  "Use these follow-ups when alert setup needs inbox triage, delivery channels, or product orientation.";


/** Operator Sources — no self-href to the default alert-rules hub path. */
export const ALERT_RULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Notifications tab", href: governanceAlertRulesTabHref("notifications") },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
