import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AZURE_BOARDS_HELP_CANONICAL_PATH = "/help/azure-boards" as const;

export const AZURE_BOARDS_HELP_CLAIM_DISCIPLINE =
  "This Azure Boards integration guide orients operators on work-item creation from ArchLucid findings — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a signed-review diligence Sources package from your tenant. Open the Azure Boards integration settings or Integration readiness when you need live connector health.";

export const AZURE_BOARDS_HELP_SOURCES_INTRO =
  "Use these follow-ups when Azure Boards vocabulary turns into live connector setup, readiness checks, or sibling ITSM destinations.";

export type AzureBoardsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/azure-boards`. */
export const AZURE_BOARDS_HELP_SOURCES: readonly AzureBoardsHelpSourceLink[] = [
  { label: "Azure Boards integration", href: "/integrations/azure-boards" },
  { label: "Integration readiness", href: inAppHelpHref("integration-readiness") },
  { label: "Jira integration", href: "/integrations/jira" },
  { label: "ServiceNow integration", href: "/integrations/servicenow" },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
] as const;
