/**
 * Retired help topic slugs that permanently redirect to a canonical `/help/{slug}` path.
 * Bookmarks may still hit the legacy slug via App Router; traffic is scored on the target only.
 *
 * Path literals only — no imports — so `product-documentation-registry.inAppHelpHref` can resolve
 * redirects without circular initialization with route copy modules.
 */
export const HELP_TOPIC_PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {
  "governance-api-contracts": "/help/api-contracts",
  "cloud-connections-aws": "/help/cloud-connections/aws",
  "cloud-connections-azure": "/help/cloud-connections/azure",
  "cloud-connections-gcp": "/help/cloud-connections/gcp",
  "core-pilot": "/help/first-architecture-review",
  "creating-runs": "/help/review-guide",
  "data-handling-tenant-isolation": "/help/data-handling",
  "evaluator-workbook": "/help/choose-your-next-step",
  "path-chooser": "/help/choose-your-next-step",
  "evidence-only-review": "/help/first-architecture-review",
  "first-hour-operator-path": "/help/first-architecture-review",
  "first-pilot-path": "/help/first-architecture-review",
  "first-review": "/help/first-architecture-review#printable-first-run-evidence-checklist",
  "first-value-20-minutes": "/help/first-architecture-review#first-value-in-20-minutes",
  "how-it-works": "/help/getting-started#how-archlucid-works",
  "integrations/azure-boards": "/help/azure-boards",
  "operator-auth-roles": "/help/users-and-roles",
  "pilot-nav-profile": "/help/pilot-guide",
  "pilot-roi-model": "/help/sponsor-report#pilot-roi-measurement",
  "product-overview": "/help/sponsor-report#what-archlucid-is",
  "starting-reviews": "/help/review-guide",
  "developer-troubleshooting": "/help/engineering-troubleshooting",
};

/** Hyphen bookmark slugs that redirect to slash URLs but remain in the product registry. */
export const HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS = [
  "cloud-connections-aws",
  "cloud-connections-azure",
  "cloud-connections-gcp",
] as const;

export function resolveHelpTopicPermanentRedirect(slug: string): string | null {
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  return HELP_TOPIC_PERMANENT_REDIRECTS[trimmed] ?? null;
}
