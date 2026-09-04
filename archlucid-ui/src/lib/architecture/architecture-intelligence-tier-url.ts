import {
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture/architecture-intelligence-review-tier";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";

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
  const params = new URLSearchParams(currentSearch);

  if (tier === null || tier === "Standard") {
    params.delete(ARCHITECTURE_INTELLIGENCE_TIER_PARAM);
  } else {
    params.set(ARCHITECTURE_INTELLIGENCE_TIER_PARAM, tier);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
