import {
  SPECIALTY_REVIEW_TEMPLATES_INTRO,
  SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE,
  SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE,
} from "@/lib/specialty-review-templates";

export const SPECIALTY_WALKTHROUGHS_HELP_PAGE_TITLE = SPECIALTY_REVIEW_TEMPLATES_PAGE_TITLE;

export const SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE = SPECIALTY_REVIEW_TEMPLATES_PAGE_SUBTITLE;

export const SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE_BUYER =
  "Pick a starter template, then open Start review when you are ready for live intake." as const;

export function specialtyWalkthroughsHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE_BUYER
    : SPECIALTY_WALKTHROUGHS_HELP_PAGE_SUBTITLE;
}

export const SPECIALTY_WALKTHROUGHS_HELP_OVERVIEW = SPECIALTY_REVIEW_TEMPLATES_INTRO;

export const SPECIALTY_WALKTHROUGHS_HELP_START_HERE_CARD_TITLE = "Start here" as const;

export const SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION = {
  label: "Start review",
  href: "/architecture/reviews/new",
  testId: "help-specialty-walkthroughs-start-review",
} as const;
