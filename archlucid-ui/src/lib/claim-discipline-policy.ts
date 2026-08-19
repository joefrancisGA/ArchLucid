/**
 * Surfaces whose headers already state scope omit the shared claim-discipline band so operators
 * are not told twice that a page is not a sealed-review diligence Sources package.
 */
export const CLAIM_DISCIPLINE_BAND_OMIT_SLUGS: ReadonlySet<string> = new Set([
  "account-security-settings",
  "admin-configuration",
  "admin-health",
  "admin-itsm-connectors",
  "admin-tenants",
  "agent-model-catalog",
  "ai-usage-settings",
  "api-keys-settings",
  "auth-domains-settings",
  "azure-boards-integration",
  "azure-permissions-help",
  "baseline-settings",
  "cloud-connections",
  "cloud-connections-gcp",
  "connection-status",
  "demo-readiness",
  "deployment-status",
  "digest-sponsor",
  "digests-schedule",
  "evidence-proposals",
  "extract-upload-settings",
  "faq",
  "fleet-llm-cogs",
  "get-started",
  "help-ai-usage",
  "help-alerts",
  "help-api-keys",
  "help-baseline-settings",
  "help-billing-and-plans",
  "help-connection-status",
  "help-digests",
  "help-jira-integration",
  "help-model-governance",
  "help-notifications",
  "help-pilot-feedback",
  "help-preferences",
  "help-recurrence-schedules",
  "help-servicenow-integration",
  "help-slack-integration",
  "help-system-health",
  "help-teams-integration",
  "help-webhooks-integration",
  "help-workspace-settings",
  "identity-providers-diagnostics-settings",
  "identity-providers-oidc-settings",
  "identity-providers-saml-settings",
  "identity-providers-settings",
  "integration-events-dlq",
  "itsm-oauth-callback",
  "jira-integration",
  "model-governance-settings",
  "notification-preference-center",
  "operator-billing-settings",
  "operator-home",
  "platform-bundled-policy-packs",
  "preferences-settings",
  "pricing-quote-aging",
  "product-learning",
  "provenance",
  "quick-scan",
  "rag-health",
  "recommendation-learning",
  "report-a-problem-help",
  "role-mapping-settings",
  "scim-provisioning-settings",
  "servicenow-integration",
  "showcase",
  "signup",
  "signup-verify",
  "slack-integration",
  "sso-wizard-settings",
  "teams-integration",
  "tenant-health",
  "tenant-settings",
  "trial-funnel",
  "users-and-roles-help",
  "validate-route",
  "webhooks-integration",
  "welcome",
  "why",
]);

export function shouldOmitClaimDisciplineBand(stripSlug: string): boolean {
  return CLAIM_DISCIPLINE_BAND_OMIT_SLUGS.has(stripSlug);
}

export function expectsVisibleClaimDisciplineBand(stripSlug: string): boolean {
  return !shouldOmitClaimDisciplineBand(stripSlug);
}

export function resolveClaimDisciplineForStrip(
  stripSlug: string,
  claim: string | undefined,
): string | undefined {
  if (shouldOmitClaimDisciplineBand(stripSlug)) {
    return undefined;
  }

  return claim;
}

/** Drops the claim-discipline TOC entry when the strip omits the band so scroll-spy links stay valid. */
export function resolveGuideHeadingsForStrip<T extends { readonly id: string }>(
  stripSlug: string,
  headings: readonly T[],
  claimHeadingId: string,
): readonly T[] {
  if (!shouldOmitClaimDisciplineBand(stripSlug)) {
    return headings;
  }

  return headings.filter((heading) => heading.id !== claimHeadingId);
}
