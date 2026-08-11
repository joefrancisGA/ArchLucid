import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const JIRA_INTEGRATION_CANONICAL_PATH = "/integrations/jira" as const;

export const JIRA_INTEGRATION_CLAIM_DISCIPLINE =
  "Jira outbound settings configure how findings and reviews create work items — they are not a signed-review diligence Sources package. Open Integration readiness or Audit when you need operational or governed trails.";

export const JIRA_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when connection health, readiness checks, or related work-item integrations need attention.";


/** Operator Sources — no self-href to `/integrations/jira`. */
export const JIRA_INTEGRATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Azure Boards", href: "/integrations/azure-boards" },
  { label: "ServiceNow", href: "/integrations/servicenow" },
  { label: "Audit", href: "/governance/audit" },
  { label: "How integration readiness works", href: inAppHelpHref("integration-readiness") },
] as const;
