import { ASK_REVIEW_QUESTIONS_CANONICAL_PATH } from "@/lib/ask-review-questions-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_PATH = "/help/prior-manifest-retrieval" as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE = "Ask memory from finalized reviews";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_SUBTITLE =
  "How finalized architecture reviews become searchable tenant memory for Ask — and when to use search or second-review tools instead.";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_OVERVIEW =
  "After you finalize a review, its decisions and findings can ground Ask answers. Use this guide to understand what gets indexed, how to ask against a signed record, and when to open search or repeat-review help instead.";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS = {
  openAsk: {
    label: "Open Ask review questions",
    href: ASK_REVIEW_QUESTIONS_CANONICAL_PATH,
  },
  architecturePackages: {
    label: "Architecture packages",
    href: inAppHelpHref("review-packages"),
  },
} as const;
