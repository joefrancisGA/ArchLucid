export const ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS = ["Trial", "Standard", "Deep"] as const;

export type ArchitectureIntelligenceReviewTier = (typeof ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS)[number];

export function isArchitectureIntelligenceReviewTier(
  value: string | null | undefined,
): value is ArchitectureIntelligenceReviewTier {
  return (
    value === "Trial" || value === "Standard" || value === "Deep"
  );
}

export function architectureIntelligenceReviewTierLabel(
  tier: ArchitectureIntelligenceReviewTier,
): string {
  switch (tier) {
    case "Trial":
      return "Light (fewest specialist roles, lowest cost)";
    case "Standard":
      return "Standard (default)";
    case "Deep":
      return "Deep (most specialist roles, highest cost)";
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
