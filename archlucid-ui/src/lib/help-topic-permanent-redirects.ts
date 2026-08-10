import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";

/**
 * Retired help topic slugs that permanently redirect to a canonical `/help/{slug}` path.
 * Bookmarks may still hit the legacy slug via App Router; traffic is scored on the target only.
 */
export const HELP_TOPIC_PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {
  "creating-runs": REVIEW_GUIDE_HELP_TRAFFIC_PATH,
};

export function resolveHelpTopicPermanentRedirect(slug: string): string | null {
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  return HELP_TOPIC_PERMANENT_REDIRECTS[trimmed] ?? null;
}
