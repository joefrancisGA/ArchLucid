import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const JIRA_INTEGRATION_CANONICAL_PATH = "/integrations/jira" as const;

export const JIRA_INTEGRATION_HELP_TOPIC_LABEL = "How Jira integration works";

export const JIRA_INTEGRATION_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const JIRA_INTEGRATION_CLAIM_DISCIPLINE =
  "This page explains how Jira outbound settings configure work-item creation from findings and reviews — open Integration readiness, Azure Boards, ServiceNow, or Audit when you need connection health, readiness checks, or governed trails.";

export const JIRA_INTEGRATION_FOLLOW_UPS_TITLE = "Where to go next";

export const JIRA_INTEGRATION_CLAIM_HEADING_ID = "jira-integration-claim-discipline-heading" as const;

export const JIRA_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when connection health, readiness checks, or related work-item integrations need attention.";


/** Operator Sources — no self-href to `/integrations/jira`. */
export const JIRA_INTEGRATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Azure Boards", href: "/integrations/azure-boards" },
  { label: "ServiceNow", href: "/integrations/servicenow" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "How integration readiness works", href: inAppHelpHref("integration-readiness") },
] as const;
