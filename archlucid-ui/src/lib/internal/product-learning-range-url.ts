import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

export type ProductLearningTimeRangeKey = "all" | "7d" | "30d";

export const PRODUCT_LEARNING_RANGE_PARAM = "range";

const RANGE_IDS = new Set<string>(["all", "7d", "30d"]);

export const DEFAULT_PRODUCT_LEARNING_RANGE: ProductLearningTimeRangeKey = "all";

export function parseProductLearningRangeFromSearch(
  raw: string | null | undefined,
): ProductLearningTimeRangeKey {
  if (raw === null || raw === undefined) {
    return DEFAULT_PRODUCT_LEARNING_RANGE;
  }

  const trimmed = raw.trim();

  if (!RANGE_IDS.has(trimmed)) {
    return DEFAULT_PRODUCT_LEARNING_RANGE;
  }

  return trimmed as ProductLearningTimeRangeKey;
}

export function productLearningRangeHrefFromSearch(
  currentSearch: string,
  range: ProductLearningTimeRangeKey,
  pathname: string = PRODUCT_LEARNING_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (range === DEFAULT_PRODUCT_LEARNING_RANGE) {
    params.delete(PRODUCT_LEARNING_RANGE_PARAM);
  } else {
    params.set(PRODUCT_LEARNING_RANGE_PARAM, range);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
