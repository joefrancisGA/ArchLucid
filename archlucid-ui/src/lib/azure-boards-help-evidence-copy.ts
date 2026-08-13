import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AZURE_BOARDS_HELP_CANONICAL_PATH = "/help/azure-boards" as const;

export const AZURE_BOARDS_HELP_PAGE_TITLE = "Azure Boards integration" as const;

export const AZURE_BOARDS_HELP_PAGE_SUBTITLE =
  "Connect Azure DevOps for work item creation from ArchLucid findings — independent of your architecture cloud provider." as const;

export const AZURE_BOARDS_HELP_CONTINUE_HEADING = "Continue in product" as const;

export const AZURE_BOARDS_HELP_SOURCES_HEADING = EVALUATION_SOURCES_TITLE;

export const AZURE_BOARDS_HELP_PRIMARY_ACTIONS = {
  openSettings: { label: "Open Azure Boards settings", href: "/integrations/azure-boards" },
} as const;

export const AZURE_BOARDS_HELP_AUTHORITY_NOTE =
  "Outbound work-item creation needs a role that can manage integrations for this workspace." as const;

export const AZURE_BOARDS_HELP_PAT_SCOPE_WARNING =
  "Grant only work-item read and write scopes for the target project. Do not grant code, pipeline, release, or organization-administration scopes unless your security policy requires broader tokens for unrelated workflows." as const;

export const AZURE_BOARDS_HELP_PAT_NON_RECOVERABLE_WARNING =
  "The PAT value is never shown again in ArchLucid after setup. Store the token only in your vault or secret store reference." as const;

export const AZURE_BOARDS_HELP_CONNECTION_STATUS_HEADING = "Connection status for this workspace" as const;

export const AZURE_BOARDS_HELP_CLAIM_DISCIPLINE =
  "This Azure Boards integration guide orients architects on work-item creation from ArchLucid findings — it is help orientation, not a signed-review diligence Sources package from your tenant. Open the Azure Boards integration settings or Integration readiness when you need live connector health.";

export const AZURE_BOARDS_HELP_SOURCES_INTRO =
  "Use these follow-ups when Azure Boards vocabulary turns into live connector setup, readiness checks, or sibling ITSM destinations.";


/** Operator Sources — no self-href to `/help/azure-boards`. */
export const AZURE_BOARDS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Azure Boards integration", href: "/integrations/azure-boards" },
  { label: "Integration readiness", href: inAppHelpHref("integration-readiness") },
  { label: "Jira integration", href: "/integrations/jira" },
  { label: "ServiceNow integration", href: "/integrations/servicenow" },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
] as const;
