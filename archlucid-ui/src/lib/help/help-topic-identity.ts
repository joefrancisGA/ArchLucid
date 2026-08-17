/**
 * Shared help-topic slug identity between the customer documentation registry
 * and the operator page-help map. Leaf module — do not import the registry
 * (that would cycle through help catalog consumers).
 */

/** Operator map slugs that have no customer registry article yet. */
export const MAP_ONLY_HELP_TOPIC_SLUGS = ["review-artifacts"] as const;

export type MapOnlyHelpTopicSlug = (typeof MAP_ONLY_HELP_TOPIC_SLUGS)[number];

export function isMapOnlyHelpTopicSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();

  return (MAP_ONLY_HELP_TOPIC_SLUGS as readonly string[]).includes(normalized);
}

/**
 * True when a page-help slug is either a customer registry article or a documented map-only orphan.
 */
export function isAllowedPageHelpTopicSlug(
  slug: string,
  registrySlugs: ReadonlySet<string>,
): boolean {
  const normalized = slug.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  if (registrySlugs.has(normalized)) {
    return true;
  }

  return isMapOnlyHelpTopicSlug(normalized);
}
