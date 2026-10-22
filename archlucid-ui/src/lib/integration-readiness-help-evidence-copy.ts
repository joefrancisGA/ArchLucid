import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const INTEGRATION_READINESS_HELP_CANONICAL_PATH = "/help/integration-readiness" as const;

export const INTEGRATION_READINESS_HELP_TOPIC_LABEL = "How integration readiness works" as const;

export const INTEGRATION_READINESS_HELP_PRIMARY_ACTION = {
  label: "Open Connection status",
  href: "/administration/connection-status",
  testId: "help-integration-readiness-open-connection-status",
} as const;

export const INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE =
  "This guide orients architects on connector setup priority — open Connection status or a specific integration settings page when you need live connector health.";

export const SECURENOW_INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE =
  "This guide orients security operators on connector setup priority — open Connection status, Azure connections, or a ticketing integration when you need live connector health.";

export const INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const INTEGRATION_READINESS_HELP_CLAIM_HEADING_ID =
  "help-integration-readiness-claim-discipline-heading" as const;

export const INTEGRATION_READINESS_HELP_SOURCES_INTRO =
  "Use these follow-ups when readiness labels turn into live connector setup, ITSM destinations, or cloud evidence attachments.";

export const SECURENOW_INTEGRATION_READINESS_HELP_SOURCES_INTRO =
  "Use these follow-ups when readiness labels turn into Azure inventory collection, outbound ticketing, or live connector health checks.";

/** Operator Sources - no self-href to `/help/integration-readiness`. */
export const INTEGRATION_READINESS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Jira integration", href: "/integrations/jira" },
  { label: "ServiceNow integration", href: "/integrations/servicenow" },
  { label: "Azure Boards", href: "/integrations/azure-boards" },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
  { label: "Architecture digests", href: inAppHelpHref("digests") },
] as const;

export const SECURENOW_INTEGRATION_READINESS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
  { label: "Jira integration", href: "/integrations/jira" },
  { label: "ServiceNow integration", href: "/integrations/servicenow" },
  { label: "Teams integration", href: "/integrations/teams" },
] as const;

export function resolveIntegrationReadinessHelpClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE
    : INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE;
}

export function resolveIntegrationReadinessHelpSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_INTEGRATION_READINESS_HELP_SOURCES_INTRO
    : INTEGRATION_READINESS_HELP_SOURCES_INTRO;
}

export function resolveIntegrationReadinessHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_INTEGRATION_READINESS_HELP_SOURCES
    : INTEGRATION_READINESS_HELP_SOURCES;
}
