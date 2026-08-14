import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  SERVICENOW_INTEGRATION_SOURCES_INTRO,
} from "@/lib/servicenow-integration-evidence-copy";
import { INTEGRATIONS_AZURE_BOARDS_PATH, INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH = "/help/servicenow-integration" as const;

export const SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains ServiceNow outbound routing, connection health, and CMDB behavior — use it to configure how findings create ServiceNow incidents, then open Integration readiness or Audit trail when procurement setup or governed activity needs follow-up.";

export const SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO = SERVICENOW_INTEGRATION_SOURCES_INTRO;

/** Help follow-ups — no self-href, one readiness destination, one Jira destination. */
export const SERVICENOW_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Integration readiness help",
    href: inAppHelpHref("integration-readiness"),
    when: "Read procurement-oriented setup guidance when multiple connectors need attention",
  },
  {
    label: "Jira integration",
    href: INTEGRATIONS_JIRA_PATH,
    when: "Open Jira when work-item routing needs parallel Atlassian configuration",
  },
  {
    label: "Azure Boards integration",
    href: INTEGRATIONS_AZURE_BOARDS_PATH,
    when: "Compare Azure Boards routing when work items span Microsoft tools",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow governed activity when connection or routing changes need audit context",
  },
] as const;
