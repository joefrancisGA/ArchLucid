import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  TEAMS_INTEGRATION_CANONICAL_PATH,
  TEAMS_INTEGRATION_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/teams-integration-evidence-copy";

export const TEAMS_INTEGRATION_HELP_CANONICAL_PATH = "/help/teams-integration" as const;

export const TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains how Teams destinations route governance alerts — it is not a sealed-review diligence Sources package.";

export const TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const TEAMS_INTEGRATION_HELP_SOURCES_INTRO = TEAMS_INTEGRATION_SOURCES_INTRO;

export const TEAMS_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Microsoft Teams notifications", href: TEAMS_INTEGRATION_CANONICAL_PATH },
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Slack", href: "/integrations/slack" },
  { label: "Webhooks", href: "/integrations/webhooks" },
  { label: "How alerts work", href: "/help/alerts" },
  { label: "Integration readiness help", href: "/help/integration-readiness" },
] as const;

export const TEAMS_INTEGRATION_HELP_OPERATOR_CLAIM = TEAMS_INTEGRATION_CLAIM_DISCIPLINE;
