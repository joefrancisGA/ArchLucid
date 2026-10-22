import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PILOT_GUIDE_HELP_PATH = "/help/pilot-guide" as const;

export const PILOT_GUIDE_HELP_PAGE_TITLE = "Pilot guide";

export const PILOT_GUIDE_HELP_PAGE_SUBTITLE =
  "Prepare for a pilot, run the first architecture review, interpret outputs, report issues, and get help.";

export const PILOT_GUIDE_HELP_OVERVIEW =
  "Use this guide when you are planning or running an ArchLucid pilot. It complements the first-architecture-review walkthrough with pilot preparation, interpretation, and support paths.";

export const PILOT_GUIDE_HELP_PRIMARY_ACTIONS = {
  startReview: {
    label: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    href: REVIEWS_NEW_PATH,
  },
  firstArchitectureReview: {
    label: "Your first architecture review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  },
  firstReviewGuide: {
    label: "First review guide",
    href: FIRST_REVIEW_GUIDE_PATH,
  },
  gettingStarted: {
    label: "Getting started",
    href: inAppHelpHref("getting-started"),
  },
} as const;
