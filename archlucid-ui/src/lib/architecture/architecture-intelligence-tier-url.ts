import {
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture/architecture-intelligence-review-tier";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const ARCHITECTURE_INTELLIGENCE_TIER_PARAM = "tier";

export function parseArchitectureIntelligenceTierFromSearch(
  raw: string | null | undefined,
): ArchitectureIntelligenceReviewTier | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!isArchitectureIntelligenceReviewTier(trimmed)) {
    return null;
  }

  return trimmed;
}

export function architectureIntelligenceTierHrefFromSearch(
  currentSearch: string,
  tier: ArchitectureIntelligenceReviewTier | null,
  pathname: string = ARCHITECTURE_INTELLIGENCE_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (tier === null || tier === "Standard") {
      params.delete(ARCHITECTURE_INTELLIGENCE_TIER_PARAM);
    } else {
      params.set(ARCHITECTURE_INTELLIGENCE_TIER_PARAM, tier);
    }
    },
  });
}
