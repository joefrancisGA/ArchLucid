import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import {
  WHY_SECURENOW_CONVERSATION_MAILTO,
} from "@/lib/marketing/why-securenow-draft-copy";

export const SECURENOW_REVIEWER_HOME_SECTION_HEADING = "For reviewers" as const;

export const SECURENOW_REVIEWER_HOME_SECTION_LEAD =
  "Internal drafts for a champion. Not an approved offer. SecureNow beta remains NO_GO." as const;

export const SECURENOW_REVIEWER_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/why-securenow",
    label: "Draft overview",
    summary: "Who it is for, the six-step workflow, and the refusals.",
  },
  {
    href: "/why-securenow#reviewer-pack",
    label: "Reviewer packet",
    summary: "Ask for the procurement index, the quote cover, and the pilot proposal. Fees stay off this page.",
  },
  {
    href: WHY_SECURENOW_CONVERSATION_MAILTO,
    label: "Request a conversation",
    summary: "Same intake as the draft page. Not a signup.",
  },
];
