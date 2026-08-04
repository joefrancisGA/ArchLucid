import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SERVICENOW_INTEGRATION_CANONICAL_PATH = "/integrations/servicenow" as const;

export const SERVICENOW_INTEGRATION_CLAIM_DISCIPLINE =
  "ServiceNow outbound settings configure how findings and reviews create incidents — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Integration readiness or Audit when you need operational or governed trails.";

export const SERVICENOW_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when connection health, readiness checks, or related work-item integrations need attention.";

export type ServiceNowIntegrationSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/integrations/servicenow`. */
export const SERVICENOW_INTEGRATION_SOURCES: readonly ServiceNowIntegrationSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Jira", href: "/integrations/jira" },
  { label: "Azure Boards", href: "/integrations/azure-boards" },
  { label: "Audit", href: "/governance/audit" },
  { label: "How integration readiness works", href: inAppHelpHref("integration-readiness") },
] as const;
