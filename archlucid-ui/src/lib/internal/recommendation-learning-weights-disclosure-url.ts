export const RECOMMENDATION_LEARNING_WEIGHTS_OPEN_PARAM = "recommendationLearningWeightsOpen";

export function parseRecommendationLearningWeightsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function recommendationLearningWeightsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(RECOMMENDATION_LEARNING_WEIGHTS_OPEN_PARAM);
  } else {
    params.set(RECOMMENDATION_LEARNING_WEIGHTS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
