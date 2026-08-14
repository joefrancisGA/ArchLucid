import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const SLACK_INTEGRATION_CANONICAL_PATH = "/integrations/slack" as const;

export const SLACK_INTEGRATION_HELP_TOPIC_LABEL = "How Slack notifications work";

export const SLACK_INTEGRATION_CLAIM_DISCIPLINE =
  "Slack destinations route governance alerts to incoming webhooks — they are not a sealed-review diligence Sources package. Open Alert rules, Integration readiness, or Audit when you need operational or governed trails.";

export const SLACK_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when destinations need routing rules, readiness checks, or a sibling notification channel.";


/** Operator Sources — no self-href to `/integrations/slack`. */
export const SLACK_INTEGRATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert rules", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Microsoft Teams", href: "/integrations/teams" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
