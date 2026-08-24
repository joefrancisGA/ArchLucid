import { architectureDraftPath } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

import {
  REVIEWS_HUB_HEADER_START_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL,
} from "./reviews-hub-copy";

export type ReviewsHubHeaderPrimary = {
  readonly href: string;
  readonly label: string;
  /** True when the primary targets a single known draft (strip should hide). */
  readonly continuesSingleDraft: boolean;
};

/**
 * Resolve the Reviews hub header primary from draft count.
 * One draft → Continue that draft. Zero or many → Start (list chooses among many).
 */
export function resolveReviewsHubHeaderPrimary(
  drafts: readonly ArchitectureDraftRegistryEntry[],
): ReviewsHubHeaderPrimary {
  if (drafts.length === 1) {
    const sole = drafts[0];

    if (sole !== undefined) {
      return {
        href: architectureDraftPath(sole.architectureId),
        label: REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL,
        continuesSingleDraft: true,
      };
    }
  }

  return {
    href: "/architecture/reviews/new",
    label: REVIEWS_HUB_HEADER_START_LABEL,
    continuesSingleDraft: false,
  };
}

/** Resume strip is the multi-draft chooser; hide when header already Continues the only draft. */
export function shouldShowReviewsHubResumeDrafts(draftCount: number): boolean {
  return draftCount > 1;
}
