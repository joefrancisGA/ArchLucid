import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const INTEGRATION_READINESS_HELP_CANONICAL_PATH = "/help/integration-readiness" as const;

export const INTEGRATION_READINESS_HELP_PRIMARY_ACTION = {
  label: "Open Connection status",
  href: "/administration/connection-status",
  testId: "help-integration-readiness-open-connection-status",
} as const;

export const INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE =
  "This integration readiness guide is architect orientation for connector setup priority — it is not a signed-review diligence Sources package. Open Connection status or a specific integration settings page when you need live connector health.";

export const INTEGRATION_READINESS_HELP_SOURCES_INTRO =
  "Use these follow-ups when readiness labels turn into live connector setup, ITSM destinations, or cloud evidence attachments.";


/** Operator Sources - no self-href to `/help/integration-readiness`. */
export const INTEGRATION_READINESS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Jira integration", href: "/integrations/jira" },
  { label: "ServiceNow integration", href: "/integrations/servicenow" },
  { label: "Azure Boards", href: "/integrations/azure-boards" },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
  { label: "Architecture digests", href: inAppHelpHref("digests") },
] as const;
