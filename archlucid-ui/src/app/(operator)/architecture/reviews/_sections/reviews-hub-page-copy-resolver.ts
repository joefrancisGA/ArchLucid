import {
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
  WORKING_REVIEWS_HUB_PAGE_SUBTITLE,
  WORKING_REVIEWS_HUB_PAGE_TITLE,
} from "./reviews-hub-copy";

export type ReviewsHubPageCopy = {
  readonly title: string;
  readonly subtitle: string;
};

/** Guided keeps portfolio language; Working uses inbox framing (AO-26). */
export function resolveReviewsHubPageCopy(isWorkingMode: boolean): ReviewsHubPageCopy {
  if (isWorkingMode) {
    return {
      title: WORKING_REVIEWS_HUB_PAGE_TITLE,
      subtitle: WORKING_REVIEWS_HUB_PAGE_SUBTITLE,
    };
  }

  return {
    title: REVIEWS_HUB_PAGE_TITLE,
    subtitle: REVIEWS_HUB_PAGE_SUBTITLE,
  };
}
