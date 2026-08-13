import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  JIRA_INTEGRATION_CANONICAL_PATH,
  JIRA_INTEGRATION_CLAIM_DISCIPLINE,
  JIRA_INTEGRATION_SOURCES,
  JIRA_INTEGRATION_SOURCES_INTRO,
} from "@/lib/jira-integration-evidence-copy";

export const JIRA_INTEGRATION_HELP_CANONICAL_PATH = "/help/jira-integration" as const;

export const JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains Jira outbound routing and connection health — it is not a signed-review diligence Sources package.";

export const JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const JIRA_INTEGRATION_HELP_SOURCES_INTRO = JIRA_INTEGRATION_SOURCES_INTRO;

export const JIRA_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Jira integration", href: JIRA_INTEGRATION_CANONICAL_PATH },
  ...JIRA_INTEGRATION_SOURCES,
] as const;

export const JIRA_INTEGRATION_HELP_OPERATOR_CLAIM = JIRA_INTEGRATION_CLAIM_DISCIPLINE;
