/** In-app `/help` content taxonomy (TB-732). Rendering logic consumes this in later IA phases. */
export type ProductDocumentationContentKind =
  | "product-help"
  | "technical-documentation"
  | "internal-runbook";

const INTERNAL_RUNBOOK_SLUGS = new Set<string>([
  "first-value-20-minutes",
  "first-review",
  "policy-pack-delta-demo",
]);

/** Canonical `contentKind` for every `product-documentation-registry.ts` slug. */
export const PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG: Readonly<
  Record<string, ProductDocumentationContentKind>
> = {
  "accelerator-chooser": "product-help",
  "admin-diagnostics": "technical-documentation",
  alerts: "product-help",
  "audit-trail": "product-help",
  "authentication-sign-in": "product-help",
  "report-a-problem": "product-help",
  "billing-and-plans": "product-help",
  "cli-usage": "technical-documentation",
  "cloud-connections": "product-help",
  "cloud-connections-aws": "product-help",
  "cloud-connections-azure": "product-help",
  "cloud-connections-gcp": "product-help",
  "azure-permissions": "product-help",
  "comparison-replay": "product-help",
  "configuration-reference": "technical-documentation",
  "core-pilot": "product-help",
  "data-handling": "product-help",
  "data-handling-tenant-isolation": "product-help",
  "developer-troubleshooting": "technical-documentation",
  "enterprise-onboarding": "product-help",
  "evaluator-workbook": "product-help",
  "evidence-intake": "product-help",
  "evidence-only-review": "product-help",
  "evidence-trail": "product-help",
  "executive-summary": "product-help",
  findings: "product-help",
  "first-hour-operator-path": "product-help",
  "first-pilot-path": "product-help",
  "first-review": "internal-runbook",
  "first-value-20-minutes": "internal-runbook",
  "getting-started": "product-help",
  "governance-api-contracts": "technical-documentation",
  "governance-approval": "product-help",
  "how-it-works": "product-help",
  "integration-readiness": "product-help",
  "azure-boards": "product-help",
  "users-and-roles": "product-help",
  "path-chooser": "product-help",
  "pilot-feedback": "product-help",
  "pilot-guide": "product-help",
  "pilot-nav-profile": "product-help",
  "pilot-roi-model": "product-help",
  "prior-manifest-retrieval": "product-help",
  "policy-pack-delta-demo": "internal-runbook",
  "product-overview": "product-help",
  procurement: "product-help",
  "caiq-sig-response": "product-help",
  "dpa-template": "product-help",
  "soc2-self-assessment": "product-help",
  subprocessors: "product-help",
  "repeat-review-loop": "product-help",
  "review-guide": "product-help",
  "starting-reviews": "product-help",
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
