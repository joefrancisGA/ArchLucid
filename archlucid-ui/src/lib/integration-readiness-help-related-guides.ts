import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CLOUD_CONNECTIONS_HELP_TOPIC_LABEL } from "@/lib/cloud-connections-evidence-copy";
import { JIRA_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/jira-integration-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";

/** TB-1700 — at most three related help guides; live Connection status stays in Sources. */
export const INTEGRATION_READINESS_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: CLOUD_CONNECTIONS_HELP_TOPIC_LABEL, href: inAppHelpHref("cloud-connections") },
  { label: TEAMS_INTEGRATION_HELP_TOPIC_LABEL, href: inAppHelpHref("teams-integration") },
  { label: JIRA_INTEGRATION_HELP_TOPIC_LABEL, href: inAppHelpHref("jira-integration") },
] as const;

export const INTEGRATION_READINESS_HELP_RELATED_HEADING = "Related help" as const;

export const INTEGRATION_READINESS_HELP_RELATED_TEST_ID = "help-integration-readiness-related-help";

/** Related guides for `/help/integration-readiness`. */
export function integrationReadinessHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return INTEGRATION_READINESS_HELP_RELATED_GUIDES;
}
