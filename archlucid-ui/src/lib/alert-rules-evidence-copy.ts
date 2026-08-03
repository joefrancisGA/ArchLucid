import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

export const ALERT_RULES_CANONICAL_PATH = "/governance/alert-rules" as const;

export const ALERT_RULES_CLAIM_DISCIPLINE =
  "Alert conditions, destinations, and simulations configure when and where workspace alerts fire — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open the Alert inbox or Audit when you need a governed trail.";

export const ALERT_RULES_SOURCES_INTRO =
  "Use these follow-ups when alert setup needs inbox triage, delivery channels, or product orientation.";

export type AlertRulesSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the default alert-rules hub path. */
export const ALERT_RULES_SOURCES: readonly AlertRulesSourceLink[] = [
  { label: "Alert inbox", href: "/governance/alerts" },
  { label: "Notifications tab", href: governanceAlertRulesTabHref("routing") },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
