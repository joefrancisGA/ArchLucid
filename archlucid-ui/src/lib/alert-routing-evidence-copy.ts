import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { GOVERNANCE_ALERTS_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERT_ROUTING_TAB_PATH = governanceAlertRulesTabHref("notifications");

export const ALERT_ROUTING_CLAIM_DISCIPLINE =
  "This page sets where qualifying alerts are sent and shows delivery attempts. It is not proof for auditors on its own. Open the Alert inbox or Conditions tab before treating delivery setup as audit evidence.";

export const ALERT_ROUTING_SOURCES_INTRO =
  "Use these follow-ups when routing setup needs inbox triage, condition rules, or channel integrations.";


/** Operator Sources — no self-href to the Notifications tab. */
export const ALERT_ROUTING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Alert conditions", href: governanceAlertRulesTabHref("rules") },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
