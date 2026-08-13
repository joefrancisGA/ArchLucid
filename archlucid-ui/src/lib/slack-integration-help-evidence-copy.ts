import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  SLACK_INTEGRATION_CANONICAL_PATH,
  SLACK_INTEGRATION_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_SOURCES_INTRO,
} from "@/lib/slack-integration-evidence-copy";

export const SLACK_INTEGRATION_HELP_CANONICAL_PATH = "/help/slack-integration" as const;

export const SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains how Slack destinations route governance alerts — it is not a signed-review diligence Sources package.";

export const SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SLACK_INTEGRATION_HELP_SOURCES_INTRO = SLACK_INTEGRATION_SOURCES_INTRO;

export const SLACK_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Slack notifications", href: SLACK_INTEGRATION_CANONICAL_PATH },
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Microsoft Teams", href: "/integrations/teams" },
  { label: "Webhooks", href: "/integrations/webhooks" },
  { label: "How alerts work", href: "/help/alerts" },
  { label: "Integration readiness help", href: "/help/integration-readiness" },
] as const;

export const SLACK_INTEGRATION_HELP_OPERATOR_CLAIM = SLACK_INTEGRATION_CLAIM_DISCIPLINE;
