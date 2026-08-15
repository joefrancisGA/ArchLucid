import { EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_ANCHOR } from "@/lib/core-pilot-help-ia-dual";
import { REVIEW_PACKAGES_HELP_LEGACY_ANCHOR_ALIASES } from "@/lib/review-packages-help-anchor-honesty-surfaces";

const FIRST_ARCHITECTURE_REVIEW_HELP_HASH_ALIASES: Readonly<Record<string, string>> = {
  "fast-path-evidence-only": EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_ANCHOR,
};

const HELP_TOPIC_HASH_ALIASES_BY_SLUG: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "first-architecture-review": FIRST_ARCHITECTURE_REVIEW_HELP_HASH_ALIASES,
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
