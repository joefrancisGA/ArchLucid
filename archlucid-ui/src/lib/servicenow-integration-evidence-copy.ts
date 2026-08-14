import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const SERVICENOW_INTEGRATION_CANONICAL_PATH = "/integrations/servicenow" as const;

export const SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL = "How ServiceNow integration works";

export const SERVICENOW_INTEGRATION_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const SERVICENOW_INTEGRATION_CLAIM_DISCIPLINE =
  "This page explains how ServiceNow outbound settings configure incident creation from findings and reviews — open Integration readiness, Jira, Azure Boards, or Audit when you need connection health, readiness checks, or governed trails.";

export const SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE = "Where to go next";

export const SERVICENOW_INTEGRATION_CLAIM_HEADING_ID = "servicenow-integration-claim-discipline-heading" as const;

export const SERVICENOW_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when connection health, readiness checks, or related work-item integrations need attention.";


/** Operator Sources — no self-href to `/integrations/servicenow`. */
export const SERVICENOW_INTEGRATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Jira", href: "/integrations/jira" },
  { label: "Azure Boards", href: "/integrations/azure-boards" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "How integration readiness works", href: inAppHelpHref("integration-readiness") },
] as const;
