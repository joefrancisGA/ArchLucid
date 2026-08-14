import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  JIRA_INTEGRATION_SOURCES_INTRO,
} from "@/lib/jira-integration-evidence-copy";
import { INTEGRATIONS_SERVICENOW_PATH } from "@/lib/integrations-nav-paths";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const JIRA_INTEGRATION_HELP_CANONICAL_PATH = "/help/jira-integration" as const;

export const JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains Jira outbound routing, connection health, and workspace mappings — use it to configure how findings create Jira work items, then open Integration readiness or Audit trail when procurement setup or governed activity needs follow-up.";

export const JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const JIRA_INTEGRATION_HELP_SOURCES_INTRO = JIRA_INTEGRATION_SOURCES_INTRO;

/** Help follow-ups — no self-href, one readiness destination, one ServiceNow destination. */
export const JIRA_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Integration readiness help",
    href: inAppHelpHref("integration-readiness"),
    when: "Read procurement-oriented setup guidance when multiple connectors need attention",
  },
  {
    label: "Azure Boards integration",
    href: "/integrations/azure-boards",
    when: "Compare Azure Boards routing when work items span Microsoft and Atlassian tools",
  },
  {
    label: "ServiceNow integration",
    href: INTEGRATIONS_SERVICENOW_PATH,
    when: "Open ServiceNow when incident routing needs parallel ITSM configuration",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow governed activity when connection or routing changes need audit context",
  },
] as const;
