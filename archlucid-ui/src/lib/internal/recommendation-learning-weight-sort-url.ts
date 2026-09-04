import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";
import type { RecommendationLearningWeightDelta } from "@/types/recommendation-learning-operational";

export const RECOMMENDATION_LEARNING_WEIGHT_SORT_PARAM = "sort";
export const RECOMMENDATION_LEARNING_WEIGHT_SORT_DIR_PARAM = "dir";

export type RecommendationLearningWeightSortKey = keyof Pick<
  RecommendationLearningWeightDelta,
  "featureGroup" | "feature" | "currentWeight" | "proposedWeight" | "absoluteDelta" | "observationCount"
>;

const SORT_KEY_IDS = new Set<string>([
  "featureGroup",
  "feature",
  "currentWeight",
  "proposedWeight",
  "absoluteDelta",
  "observationCount",
]);
const SORT_DIR_IDS = new Set<string>(["asc", "desc"]);

export const DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_KEY: RecommendationLearningWeightSortKey = "absoluteDelta";
export const DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_ASC = false;

export function parseRecommendationLearningWeightSortKeyFromSearch(
  raw: string | null | undefined,
): RecommendationLearningWeightSortKey {
  if (raw === null || raw === undefined) {
    return DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_KEY;
  }

  const trimmed = raw.trim();

  if (!SORT_KEY_IDS.has(trimmed)) {
    return DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_KEY;
  }

  return trimmed as RecommendationLearningWeightSortKey;
}

export function parseRecommendationLearningWeightSortAscFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_ASC;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SORT_DIR_IDS.has(trimmed)) {
    return DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_ASC;
  }

  return trimmed === "asc";
}

export function recommendationLearningWeightSortHrefFromSearch(
  currentSearch: string,
  sortKey: RecommendationLearningWeightSortKey,
  sortAsc: boolean,
  pathname: string = RECOMMENDATION_LEARNING_CANONICAL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sortKey === DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_KEY) {
    params.delete(RECOMMENDATION_LEARNING_WEIGHT_SORT_PARAM);
  } else {
    params.set(RECOMMENDATION_LEARNING_WEIGHT_SORT_PARAM, sortKey);
  }

  if (sortAsc === DEFAULT_RECOMMENDATION_LEARNING_WEIGHT_SORT_ASC) {
    params.delete(RECOMMENDATION_LEARNING_WEIGHT_SORT_DIR_PARAM);
  } else {
    params.set(RECOMMENDATION_LEARNING_WEIGHT_SORT_DIR_PARAM, sortAsc ? "asc" : "desc");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
