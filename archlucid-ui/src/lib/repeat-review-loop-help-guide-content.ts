export const REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE = "Your repeat architecture review";

export const REPEAT_REVIEW_LOOP_HELP_LAST_REVIEWED = "2026-07-27" as const;

export const REPEAT_REVIEW_LOOP_HELP_AUDIENCE =
  "Audience: Architects and architecture leads after the first finalized architecture package.";

export const REPEAT_REVIEW_LOOP_HELP_PREREQUISITE_DETAIL =
  "Prerequisite: One successful Core Pilot finalize.";

export const REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE =
  "After the first finalized architecture review: compare, replay, policy dry-runs, and second-review proof checklist.";

export const REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER =
  "Compare, replay, and prove value after your first finalized review.";

export const REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_OPERATOR = REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE;

export function repeatReviewLoopHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER
    : REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const REPEAT_REVIEW_LOOP_HELP_OVERVIEW =
  "After one committed architecture review, ArchLucid helps you compare packages, replay checks, run approval dry-runs, and collect export-ready proof on follow-up reviews.";

export const REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SUMMARY =
  "The repeat-review loop after your first finalize: compare, replay, policy dry-runs, finalize again, and collect proof.";

/** Per-instance Mermaid theme — larger labels and higher contrast on raised surfaces. */
export const REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES: Readonly<Record<string, string>> = {
  fontSize: "16px",
  primaryTextColor: "#171717",
  secondaryTextColor: "#404040",
  tertiaryTextColor: "#525252",
  lineColor: "#404040",
  primaryColor: "#f5f5f5",
  secondaryColor: "#e5e5e5",
  tertiaryColor: "#d4d4d4",
};

export const REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES_DARK: Readonly<Record<string, string>> = {
  fontSize: "16px",
  primaryTextColor: "#f5f5f5",
  secondaryTextColor: "#d4d4d4",
  tertiaryTextColor: "#a3a3a3",
  lineColor: "#d4d4d4",
  primaryColor: "#262626",
  secondaryColor: "#404040",
  tertiaryColor: "#525252",
};

/** Buyer-safe repeat-review cycle — no CLI scripts or repo paths. */
export const REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE = `flowchart LR
  FF[First finalize] --> CMP[Compare two reviews]
  CMP --> RPL[Replay regressions]
  RPL --> DD[Policy dry-run]
  DD --> SF[Second finalize]
  SF --> PRF[Collect export-ready proof]
  PRF -.->|Next cycle| CMP`;

export const REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS = {
  compareReviews: {
    label: "Compare two reviews",
    href: "/insights/compare-two-reviews",
  },
  startNextReview: {
    label: "Start next review",
    href: "/architecture/reviews/new",
  },
  firstArchitectureReview: {
    label: "Your first architecture review",
    href: "/help/first-architecture-review",
  },
} as const;
