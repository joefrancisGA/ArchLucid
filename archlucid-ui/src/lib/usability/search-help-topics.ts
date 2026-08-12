import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { isHostConfigurationHelpSlug } from "@/lib/product-documentation-access";
import { PRODUCT_DOCUMENTATION_REGISTRY } from "@/lib/product-documentation-registry";

export type HelpTopicSearchHit = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
};

export function searchHelpTopics(query: string, take = 4): HelpTopicSearchHit[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 2) {
    return [];
  }

  const hits: HelpTopicSearchHit[] = [];
  const includeHostConfiguration = isArchLucidInternalOperatorShellEnv();

  for (const entry of PRODUCT_DOCUMENTATION_REGISTRY) {

    if (!includeHostConfiguration && isHostConfigurationHelpSlug(entry.slug)) {
      continue;
    }

    const haystack = `${entry.title} ${entry.summary} ${entry.slug}`.toLowerCase();

    if (!haystack.includes(normalized)) {
      continue;
    }

    hits.push({
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
    });
  }

  return hits.slice(0, take);
}
