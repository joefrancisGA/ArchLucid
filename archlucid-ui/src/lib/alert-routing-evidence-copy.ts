import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERT_ROUTING_TAB_PATH = "/governance/alert-rules?tab=notifications" as const;

export const ALERT_ROUTING_CLAIM_DISCIPLINE =
  "Notification destinations and delivery attempts configure where qualifying alerts go — they are not a signed-review diligence Sources package. Open the Alert inbox or Conditions tab before treating delivery setup as governance evidence.";

export const ALERT_ROUTING_SOURCES_INTRO =
  "Use these follow-ups when routing setup needs inbox triage, condition rules, or channel integrations.";


/** Operator Sources — no self-href to the Notifications tab. */
export const ALERT_ROUTING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert inbox", href: "/governance/alerts" },
  { label: "Alert conditions", href: governanceAlertRulesTabHref("rules") },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
