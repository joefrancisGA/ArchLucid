import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";
import {
  REVIEWS_NEW_PATH_HINTS,
  type ReviewsNewPathMode,
} from "@/lib/reviews-new-path-copy";

export const BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE = REVIEWS_NEW_PATH_HINTS.detailed;

export const BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE = REVIEWS_NEW_PATH_HINTS["guided-intake"];

export function reviewsNewPageSubtitle(
  buyerPolishedShell: boolean,
  activePath: ReviewsNewPathMode | null,
): string {
  if (!buyerPolishedShell) {
    return REVIEWS_NEW_PAGE_LEAD;
  }

  if (activePath === "detailed") {
    return BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE;
  }

  if (activePath === "guided-intake") {
    return BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE;
  }

  return REVIEWS_NEW_PAGE_LEAD;
}
