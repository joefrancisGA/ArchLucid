import {
  ARCHITECTURES_LIST_PATH,
  architectureDraftPath,
  architectureIdentityDraftHref,
} from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

import {
  REVIEWS_HUB_HEADER_START_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL,
  WORKING_REVIEWS_HUB_HEADER_OPEN_ARCHITECTURES_LABEL,
} from "./reviews-hub-copy";

export type ReviewsHubHeaderPrimaryOptions = {
  readonly isWorkingMode?: boolean;
};

export type ReviewsHubHeaderPrimary = {
  readonly href: string;
  readonly label: string;
  /** True when the primary targets a single known draft (strip should hide). */
  readonly continuesSingleDraft: boolean;
};

/**
 * Resolve the Reviews hub header primary from draft count.
 * One draft → Continue that draft. Zero or many → Start (list chooses among many).
 * Working mode routes empty/multi-draft primaries to Architectures, not orphan review intake (AO-26).
 */
export function resolveReviewsHubHeaderPrimary(
  drafts: readonly ArchitectureDraftRegistryEntry[],
  options: ReviewsHubHeaderPrimaryOptions = {},
): ReviewsHubHeaderPrimary {
  const isWorkingMode = options.isWorkingMode === true;

  if (drafts.length === 1) {
    const sole = drafts[0];

    if (sole !== undefined) {
      const parentArchitectureId = sole.parentArchitectureId?.trim() ?? "";

      if (isWorkingMode && parentArchitectureId.length > 0) {
        return {
          href: architectureIdentityDraftHref(parentArchitectureId, sole.draftId),
          label: REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL,
          continuesSingleDraft: true,
        };
      }

      return {
        href: architectureDraftPath(sole.draftId),
        label: REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL,
        continuesSingleDraft: true,
      };
    }
  }

  if (isWorkingMode) {
    return {
      href: ARCHITECTURES_LIST_PATH,
      label: WORKING_REVIEWS_HUB_HEADER_OPEN_ARCHITECTURES_LABEL,
      continuesSingleDraft: false,
    };
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
