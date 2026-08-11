/**
 * Retired help topic slugs that permanently redirect to a canonical `/help/{slug}` path.
 * Bookmarks may still hit the legacy slug via App Router; traffic is scored on the target only.
 *
 * Path literals only — no imports — so `product-documentation-registry.inAppHelpHref` can resolve
 * redirects without circular initialization with route copy modules.
 */
export const HELP_TOPIC_PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {
  "api-contracts": "/help/governance-api-contracts",
  "core-pilot": "/help/first-architecture-review",
  "creating-runs": "/help/review-guide",
  "data-handling-tenant-isolation": "/help/data-handling",
  "evaluator-workbook": "/help/path-chooser",
  "evidence-only-review": "/help/first-architecture-review",
  "first-hour-operator-path": "/help/first-architecture-review",
  "first-pilot-path": "/help/first-architecture-review",
  "how-it-works": "/help/getting-started#how-archlucid-works",
  "integrations/azure-boards": "/help/azure-boards",
  "operator-auth-roles": "/help/users-and-roles",
  "pilot-nav-profile": "/help/pilot-guide",
  "product-overview": "/help/executive-summary#what-archlucid-is",
  "starting-reviews": "/help/review-guide",
};

export function resolveHelpTopicPermanentRedirect(slug: string): string | null {
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  return HELP_TOPIC_PERMANENT_REDIRECTS[trimmed] ?? null;
}
