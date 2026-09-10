import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { isHostConfigurationHelpSlug } from "@/lib/product-documentation-access";
import { PRODUCT_DOCUMENTATION_REGISTRY } from "@/lib/product-documentation-registry";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

export type HelpTopicSearchHit = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
};

export function searchHelpTopics(
  query: string,
  take = 4,
  productLineId: ProductLineId = resolveProductLineIdFromEnv(),
): HelpTopicSearchHit[] {
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

    const localizedTitle = localizeProductCopy(productLineId, entry.title);
    const localizedSummary = localizeProductCopy(productLineId, entry.summary);
    const haystack = `${entry.title} ${entry.summary} ${localizedTitle} ${localizedSummary} ${entry.slug}`.toLowerCase();

    if (!haystack.includes(normalized)) {
      continue;
    }

    hits.push({
      slug: entry.slug,
      title: localizedTitle,
      summary: localizedSummary,
    });
  }

  return hits.slice(0, take);
}
