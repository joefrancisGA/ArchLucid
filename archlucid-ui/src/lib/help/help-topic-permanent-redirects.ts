/**
 * Retired help topic slugs previously redirected via App Router; IA batch 4 removed all
 * permanent bookmark redirects — legacy `/help/{slug}` URLs that are not in the registry 404.
 *
 * Kept as a stable import surface for guards and `inAppHelpHref` parity tests.
 */
export const HELP_TOPIC_PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {};

/** Former hyphen cloud bookmark slugs — slash canonicals are emitted by `inAppHelpHref` instead. */
export const HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS = [] as const;

export function resolveHelpTopicPermanentRedirect(_slug: string): string | null {
  return null;
}
