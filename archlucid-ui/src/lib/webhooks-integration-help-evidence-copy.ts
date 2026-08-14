import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  WEBHOOKS_INTEGRATION_CANONICAL_PATH,
  WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/webhooks-integration-evidence-copy";

export const WEBHOOKS_INTEGRATION_HELP_CANONICAL_PATH = "/help/webhooks-integration" as const;

export const WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains how HTTPS webhook subscriptions receive governance alerts — it is not a sealed-review diligence Sources package.";

export const WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO = WEBHOOKS_INTEGRATION_SOURCES_INTRO;

export const WEBHOOKS_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Webhooks", href: WEBHOOKS_INTEGRATION_CANONICAL_PATH },
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Slack", href: "/integrations/slack" },
  { label: "Microsoft Teams", href: "/integrations/teams" },
  { label: "How alerts work", href: "/help/alerts" },
  { label: "Integration readiness help", href: "/help/integration-readiness" },
] as const;

export const WEBHOOKS_INTEGRATION_HELP_OPERATOR_CLAIM = WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE;
