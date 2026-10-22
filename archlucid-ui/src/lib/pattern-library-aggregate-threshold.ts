import { PATTERN_LIBRARY_MINIMUM_TENANT_THRESHOLD } from "@/lib/pattern-library-provenance";

export const PATTERN_LIBRARY_MINIMUM_LIVE_CARDS = 3;

export type PatternInsightCard = {
  readonly patternKey: string;
  readonly industryVertical: string;
  readonly summary: string;
  readonly contributingTenantCount: number;
};

export function filterEligiblePatternInsightCards(
  cards: readonly PatternInsightCard[] | null | undefined,
): PatternInsightCard[] {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards.filter((card) => card.contributingTenantCount >= PATTERN_LIBRARY_MINIMUM_TENANT_THRESHOLD);
}

export function isPatternLibraryAggregateThresholdMet(
  cards: readonly PatternInsightCard[] | null | undefined,
): boolean {
  return filterEligiblePatternInsightCards(cards).length >= PATTERN_LIBRARY_MINIMUM_LIVE_CARDS;
}
