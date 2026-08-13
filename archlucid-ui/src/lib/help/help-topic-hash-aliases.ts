import { REVIEW_PACKAGES_HELP_LEGACY_ANCHOR_ALIASES } from "@/lib/review-packages-help-anchor-honesty-surfaces";

const HELP_TOPIC_HASH_ALIASES_BY_SLUG: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "review-packages": REVIEW_PACKAGES_HELP_LEGACY_ANCHOR_ALIASES,
};

export function helpTopicSlugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/help\/([^/?#]+)/);

  if (match === null) {
    return null;
  }

  const slug = match[1]?.trim().toLowerCase();

  return slug !== undefined && slug.length > 0 ? slug : null;
}

export function resolveHelpTopicHashFragment(topicSlug: string | null, hashFragment: string): string {
  const normalizedHash = hashFragment.trim().toLowerCase();

  if (topicSlug === null || normalizedHash.length === 0) {
    return normalizedHash;
  }

  const aliases = HELP_TOPIC_HASH_ALIASES_BY_SLUG[topicSlug];

  if (aliases === undefined) {
    return normalizedHash;
  }

  return aliases[normalizedHash] ?? normalizedHash;
}
