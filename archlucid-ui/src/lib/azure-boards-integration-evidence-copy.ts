import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AZURE_BOARDS_INTEGRATION_CANONICAL_PATH = "/integrations/azure-boards" as const;

export const AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE =
  "Azure Boards outbound settings configure how findings and reviews create work items — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Integration readiness or Audit when you need operational or governed trails.";

export const AZURE_BOARDS_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when connection health, readiness checks, or related work-item integrations need attention.";

export type AzureBoardsIntegrationSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/integrations/azure-boards`. */
export const AZURE_BOARDS_INTEGRATION_SOURCES: readonly AzureBoardsIntegrationSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Jira", href: "/integrations/jira" },
  { label: "ServiceNow", href: "/integrations/servicenow" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Azure Boards help", href: inAppHelpHref("azure-boards") },
  { label: "How integration readiness works", href: inAppHelpHref("integration-readiness") },
] as const;
