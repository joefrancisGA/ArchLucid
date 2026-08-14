import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";

export const WEBHOOKS_INTEGRATION_CANONICAL_PATH = "/integrations/webhooks" as const;

export const WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL = "How webhooks work";

export const WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE =
  "This page explains how HTTPS webhook subscriptions route governance alerts to your endpoints — open Alert rules, Integration readiness, Slack, or Microsoft Teams when you need routing rules, readiness checks, or sibling notification channels.";

export const WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE = "Where to go next";

export const WEBHOOKS_INTEGRATION_CLAIM_HEADING_ID = "webhooks-integration-claim-discipline-heading" as const;

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
