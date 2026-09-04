import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AZURE_BOARDS_INTEGRATION_CANONICAL_PATH = "/integrations/azure-boards" as const;

export const AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL = "How Azure Boards integration works";

export const AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE =
  "Azure Boards connection settings configure outbound work-item creation from findings — not delivery retry forensics, a signed audit record, or platform incident response. Use Integration readiness or Audit when operations needs readiness context or export follow-up.";

export const AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE = "Where to go next";

export const AZURE_BOARDS_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when connection health, readiness checks, or related work-item integrations need attention.";

/** Operator Sources — no self-href to `/integrations/azure-boards`. */
export const AZURE_BOARDS_INTEGRATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Jira", href: "/integrations/jira" },
  { label: "ServiceNow", href: "/integrations/servicenow" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Azure Boards help", href: inAppHelpHref("azure-boards") },
  { label: "How integration readiness works", href: inAppHelpHref("integration-readiness") },
] as const;
