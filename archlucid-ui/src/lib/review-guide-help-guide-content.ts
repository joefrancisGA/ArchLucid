import { REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REVIEW_GUIDE_HELP_PATH = "/help/review-guide" as const;

export const REVIEW_GUIDE_HELP_PAGE_TITLE = "Review guide";

export const REVIEW_GUIDE_HELP_PAGE_SUBTITLE =
  "Field reference for naming a review, uploading evidence, confirming scope, and finalizing the architecture review.";

export const REVIEW_GUIDE_HELP_OVERVIEW =
  "Use this guide while you create or finish an architecture review. It complements the First review guide walkthrough with the field-level steps architects follow in the wizard.";

/** Pins the export-claim sentence in REVIEW_GUIDE.md so it also reaches the generated PDF, not just the page. */
export const REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE =
  "This field reference describes the New architecture review wizard — it is product help, not a signed review record or a finalized architecture review export. Match labels and requirements to the live wizard before treating a printed copy as procurement evidence.";

export const REVIEW_GUIDE_HELP_PRIMARY_ACTIONS = {
  startReview: {
    label: "Start an architecture review",
    href: REVIEWS_NEW_PATH,
  },
  firstReviewGuide: {
    label: "Your first architecture review",
    href: FIRST_REVIEW_GUIDE_PATH,
  },
  findingsGuide: {
    label: "Findings help",
    href: inAppHelpHref("findings"),
  },
} as const;
