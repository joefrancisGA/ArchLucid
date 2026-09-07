import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH, REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Working-mode help lead — desk tasks, not first-session theater (WA-04). */
export const HELP_WORKING_DESK_QUICK_START_TITLE = "Use ArchLucid as your review desk" as const;

export const HELP_WORKING_DESK_QUICK_START_COPY =
  "Open an architecture identity, resume a child draft, inspect an architecture package, or start a new review." as const;

export const HELP_EVALUATING_ARCHITECTURE_SECTION_TITLE = "If you are evaluating ArchLucid" as const;

export const HELP_FIRST_SESSION_LEAD_MARKERS =
  /open the sample|sample walkthrough|start with your first review|first review path|finish workspace setup/i;

/** AO-42 — deny first-review-as-product narration on Working desk contextual help. */
export const AO42_WORKING_HELP_DENYLIST =
  /your first review is the product|start with your first review|first review path|sample walkthrough|first-session/i;

export type HelpDeskPrimaryAction = {
  readonly href: string;
  readonly label: string;
};

export function resolveHelpWorkingDeskPrimaryActions(): readonly HelpDeskPrimaryAction[] {
  return [
    { href: ARCHITECTURES_NEW_PATH, label: WORKING_NEW_REVIEW_LABEL },
    { href: ARCHITECTURES_LIST_PATH, label: "Open architectures" },
    { href: REVIEWS_LIST_PATH, label: "Open packages" },
    { href: inAppHelpHref("troubleshoot"), label: "Report a problem" },
  ];
}

/** F1 on home in Working mode — desk help, not first-review theater (WA-04). */
export const WORKING_HOME_OPERATOR_HELP_SLUG = "getting-started" as const;

/** Help search topics to omit on home when Working mode is active (WA-04). */
export const WORKING_HOME_HELP_SEARCH_EXCLUDED_TOPIC_IDS: readonly string[] = [
  "first-review-guide",
  "create-first-review",
  "sample-review",
];
