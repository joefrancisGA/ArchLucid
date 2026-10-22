import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";

export type WorkingEvidenceParentLink = {
  readonly label: string;
  readonly href: string;
};

export const GUIDED_ARCHITECTURE_REVIEWS_PARENT_LABEL = "Architecture reviews" as const;

/** SY-33: Working specialty pages climb out to the portfolio desk, not an unlabeled reviews hub. */
export function resolveWorkingArchitecturePortfolioParentLink(
  workingMode: boolean,
): WorkingEvidenceParentLink {
  if (workingMode) {
    return {
      label: ARCHITECTURE_DRAFTS_LIST_LABEL,
      href: ARCHITECTURES_LIST_PATH,
    };
  }

  return {
    label: GUIDED_ARCHITECTURE_REVIEWS_PARENT_LABEL,
    href: REVIEWS_LIST_PATH,
  };
}

/** SY-33: When the inbox is the correct parent, label it explicitly on Working. */
export function resolveWorkingReviewsInboxParentLink(workingMode: boolean): WorkingEvidenceParentLink {
  if (workingMode) {
    return {
      label: WORKING_REVIEWS_INBOX_NAV_LABEL,
      href: REVIEWS_LIST_PATH,
    };
  }

  return {
    label: GUIDED_ARCHITECTURE_REVIEWS_PARENT_LABEL,
    href: REVIEWS_LIST_PATH,
  };
}
