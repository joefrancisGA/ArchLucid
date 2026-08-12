import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance-route-paths";

export const WEBHOOKS_INTEGRATION_CANONICAL_PATH = "/integrations/webhooks" as const;

export const WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE =
  "Webhook subscriptions route governance alerts to HTTPS destinations — they are not a signed-review diligence Sources package. Open Alert rules, Integration readiness, or Audit when you need operational or governed trails.";

export const WEBHOOKS_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when destinations need routing rules, readiness checks, or a sibling notification channel.";


/** Operator Sources — no self-href to `/integrations/webhooks`. */
export const WEBHOOKS_INTEGRATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert rules", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Slack", href: "/integrations/slack" },
  { label: "Microsoft Teams", href: "/integrations/teams" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
