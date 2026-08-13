/** Jira integration surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  JIRA_INTEGRATION_CANONICAL_PATH,
  JIRA_INTEGRATION_HELP_TOPIC_LABEL,
} from "@/lib/jira-integration-evidence-copy";
import { JIRA_INTEGRATION_HELP_CANONICAL_PATH } from "@/lib/jira-integration-help-evidence-copy";

const JIRA_INTEGRATION_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Jira integration — outbound work-item settings, connection health, and tenant overrides for creating Jira issues from ArchLucid.",
  whatToDoNext:
    "Test the connector, set project and severity mappings, then open Integration readiness when the path is not ready.",
  whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
  whereToConfigurePrerequisite:
    "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
} as const;

export const JIRA_INTEGRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: JIRA_INTEGRATION_CANONICAL_PATH,
    entry: JIRA_INTEGRATION_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: JIRA_INTEGRATION_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Jira integration — ${JIRA_INTEGRATION_HELP_TOPIC_LABEL.toLowerCase()} and when to open integration readiness or audit.`,
      whatToDoNext:
        "Open Jira integration to test the connector and adjust routing, then follow integration readiness help for cross-connector setup.",
      whyEmpty: "This guide is always available; health rows load after the ITSM connector configuration responds.",
      whereToConfigurePrerequisite:
        "Integration readiness help covers procurement-oriented setup guidance across connector families.",
      whatToDoNextAction: {
        label: "Open Jira integration",
        href: JIRA_INTEGRATION_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read integration readiness help",
        href: "/help/integration-readiness",
      },
    },
  },
];
