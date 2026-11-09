import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import {
  WHY_SECURENOW_CONVERSATION_MAILTO,
} from "@/lib/marketing/why-securenow-draft-copy";
import { SECURENOW_REVIEWER_PACKET_PATH } from "@/lib/product-line/securenow-reviewer-packet-copy";

export const SECURENOW_REVIEWER_HOME_SECTION_HEADING = "For reviewers" as const;

export const SECURENOW_REVIEWER_HOME_SECTION_LEAD =
  "Public explanation and a synthetic sample. Not an offer. SecureNow beta remains NO_GO." as const;

export const SECURENOW_REVIEWER_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/why-securenow",
    label: "Why SecureNow",
    summary: "Who it is for, the six-step workflow, and the refusals.",
  },
  {
    href: "/securenow-sample",
    label: "SecureNow sample",
    summary: "One synthetic ranked path. Not a customer result.",
  },
  {
    href: SECURENOW_REVIEWER_PACKET_PATH,
    label: "Reviewer packet",
    summary:
      "Signed-in procurement index, SKU meters, quote sequence, trust links, and NO_GO — fees stay off this page.",
  },
  {
    href: "/why-securenow#reviewer-pack",
    label: "Public reviewer ask",
    summary: "What to request before signing in. Not an offer.",
  },
  {
    href: "/administration/securenow-quote-packet",
    label: "Quote packet",
    summary: "Four SKU identifiers and the quote sequence. Fees stay off this page.",
  },
  {
    href: WHY_SECURENOW_CONVERSATION_MAILTO,
    label: "Request a conversation",
    summary: "Same intake as the draft page. Not a signup.",
  },
  {
    href: "/administration/securenow-accessibility",
    label: "Accessibility",
    summary: "Shared WCAG target and how to report a barrier.",
  },
];
