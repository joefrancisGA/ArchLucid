/** In-app `/help` content taxonomy (TB-732). Rendering logic consumes this in later IA phases. */
export type ProductDocumentationContentKind =
  | "product-help"
  | "technical-documentation"
  | "internal-runbook";

const INTERNAL_RUNBOOK_SLUGS = new Set<string>([
  "first-pilot-operator-runbook",
  "first-value-20-minutes",
  "pre-commit-ci-gate",
]);

/** Canonical `contentKind` for every `product-documentation-registry.ts` slug. */
export const PRODUCT_DOCUMENTATION_CONTENT_KIND_BY_SLUG: Readonly<
  Record<string, ProductDocumentationContentKind>
> = {
  "accelerator-chooser": "product-help",
  "admin-diagnostics": "technical-documentation",
  alerts: "product-help",
  "audit-trail": "product-help",
  "azure-permissions": "technical-documentation",
  "billing-and-plans": "product-help",
  "cli-usage": "technical-documentation",
  "cloud-connections": "product-help",
  "cloud-connections-aws": "product-help",
  "cloud-connections-azure": "product-help",
  "cloud-connections-gcp": "product-help",
  "comparison-replay": "product-help",
  "configuration-reference": "technical-documentation",
  "core-pilot": "product-help",
  "data-handling": "product-help",
  "developer-troubleshooting": "technical-documentation",
  "enterprise-onboarding": "product-help",
  "evaluator-workbook": "product-help",
  "evidence-intake": "product-help",
  "evidence-trail": "product-help",
  "example-roi-bulletin": "product-help",
  "executive-summary": "product-help",
  findings: "product-help",
  "first-hour-operator-path": "product-help",
  "first-pilot-operator-runbook": "internal-runbook",
  "first-pilot-path": "product-help",
  "first-review": "product-help",
  "first-value-20-minutes": "internal-runbook",
  "getting-started": "product-help",
  glossary: "product-help",
  "governance-api-contracts": "technical-documentation",
  "governance-approval": "product-help",
  "how-it-works": "product-help",
  "integration-readiness": "product-help",
  "knowledge-graph": "product-help",
  "operator-auth-roles": "technical-documentation",
  "operator-shell": "product-help",
  "path-chooser": "product-help",
  "pilot-feedback": "product-help",
  "pilot-guide": "product-help",
  "pilot-nav-profile": "product-help",
  "pilot-roi-model": "product-help",
  "policy-pack-delta-demo": "product-help",
  "pre-commit-ci-gate": "internal-runbook",
  "privacy-policy": "product-help",
  procurement: "product-help",
  "projection-cache-replicas": "technical-documentation",
  "repeat-review-loop": "product-help",
  "resilience-exercises": "product-help",
  "review-guide": "product-help",
  "review-packages": "product-help",
  scope: "product-help",
  "security-trust": "product-help",
  "specialty-walkthroughs": "product-help",
  troubleshooting: "product-help",
  observability: "technical-documentation",
  "workload-identity-federation": "technical-documentation",
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
