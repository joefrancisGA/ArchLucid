/** In-app `/help` content taxonomy (TB-732). Rendering logic consumes this in later IA phases. */
export type ProductDocumentationContentKind =
  | "product-help"
  | "technical-documentation"
  | "internal-runbook";

const INTERNAL_RUNBOOK_SLUGS = new Set<string>([
  "pilot-feedback",
  "engineering-troubleshooting",
  "policy-pack-delta-demo",
  // TB-1250 — eng-facing help must not stay ungated as technical-documentation.
  "cli-usage",
  "api-contracts",
  // TB-1329 — Admin-gated while key-catalog appendix remains eng-adjacent (specialty chrome: TB-1326).
  "configuration-reference",
]);

/** Canonical `contentKind` for every `product-documentation-registry.ts` slug. */
export const PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG: Readonly<
  Record<string, ProductDocumentationContentKind>
> = {
  "accelerator-chooser": "product-help",
  "admin-diagnostics": "product-help",
  alerts: "product-help",
  digests: "product-help",
  "recurrence-schedules": "product-help",
  "roi-summary": "product-help",
  "pilot-outcomes": "product-help",
  "architecture-scorecard": "product-help",
  "connection-status": "product-help",
  "standards-and-rules": "product-help",
  "baseline-settings": "product-help",
  "slack-integration": "product-help",
  "teams-integration": "product-help",
  "webhooks-integration": "product-help",
  "api-keys": "product-help",
  "system-health": "product-help",
  "ai-usage": "product-help",
  "preferences": "product-help",
  "notifications": "product-help",
  "workspace-settings": "product-help",
  "audit-trail": "product-help",
  "authentication-sign-in": "product-help",
  "report-a-problem": "product-help",
  "contact-support": "product-help",
  "billing-and-plans": "product-help",
  "cli-usage": "internal-runbook",
  "cloud-connections": "product-help",
  "cloud-connections-aws": "product-help",
  "cloud-connections-azure": "product-help",
  "cloud-connections-gcp": "product-help",
  "azure-permissions": "product-help",
  "comparison-replay": "product-help",
  /** TB-1329 — Admin-gated while key-catalog appendix remains eng-adjacent (specialty chrome: TB-1326). */
  "configuration-reference": "internal-runbook",
  "first-architecture-review": "product-help",
  "data-handling": "product-help",
  "engineering-troubleshooting": "internal-runbook",
  "enterprise-onboarding": "product-help",
  "evidence-intake": "product-help",
  "evidence-trail": "product-help",
  "sponsor-report": "product-help",
  findings: "product-help",
  "getting-started": "product-help",
  "api-contracts": "internal-runbook",
  "governance-approval": "product-help",
  "integration-readiness": "product-help",
  "azure-boards": "product-help",
  "users-and-roles": "product-help",
  "choose-your-next-step": "product-help",
  "pilot-feedback": "internal-runbook",
  "pilot-guide": "product-help",
  "prior-manifest-retrieval": "product-help",
  "policy-packs": "product-help",
  "policy-pack-delta-demo": "internal-runbook",
  procurement: "product-help",
  "caiq-sig-response": "product-help",
  "dpa-template": "product-help",
  "soc2-self-assessment": "product-help",
  subprocessors: "product-help",
  "repeat-review-loop": "product-help",
  "review-guide": "product-help",
  "review-packages": "product-help",
  scope: "product-help",
  glossary: "product-help",
  "security-trust": "product-help",
  "specialty-walkthroughs": "product-help",
  troubleshooting: "product-help",
};

export function isInternalRunbookSlug(slug: string): boolean {
  return INTERNAL_RUNBOOK_SLUGS.has(slug);
}

export function resolveProductDocumentationContentKind(slug: string): ProductDocumentationContentKind {
  const kind = PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG[slug];

  if (kind === undefined) {
    throw new Error(`Missing contentKind mapping for help topic slug: ${slug}`);
  }

  return kind;
}

export function assertExhaustiveProductDocumentationContentKind(
  kind: ProductDocumentationContentKind,
): void {
  switch (kind) {
    case "product-help":
    case "technical-documentation":
    case "internal-runbook":
      return;

    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}
