import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
  SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL,
} from "@/lib/search-review-evidence-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/search-review-evidence-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE = "Search review evidence";

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE =
  "How to discover findings, decisions, and sealed review records across finalized packages in this workspace.";

export const SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW =
  "Search review evidence retrieves snippets across findings, decisions, and sealed records in this workspace. Use it to discover review context before opening cited packages, the evidence graph, or governance queues.";

/** Help Start here card — role-neutral access guidance for the search surface. */
export const SEARCH_REVIEW_EVIDENCE_HELP_ROLE_PRECONDITION =
  "Search review evidence with workspace read access; the index covers finalized packages unless you scope to one review.";

/** Compact access tag beside the Start here primary action. */
export const SEARCH_REVIEW_EVIDENCE_HELP_ROLE_PRECONDITION_TAG = "Read";

export const SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE = "Start here";

/** Index scope honesty — finalized packages only unless a review filter is set. */
export const SEARCH_REVIEW_EVIDENCE_HELP_INDEX_SCOPE_NOTE =
  "Results come from committed review evidence in this workspace — open the cited review or evidence trail before treating snippets as authoritative.";

export const SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION = {
  label: "Open search review evidence",
  href: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
} as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_EVIDENCE_GRAPH_HREF = "/insights/evidence-graph";

export const SEARCH_REVIEW_EVIDENCE_HELP_ASK_HREF = "/insights/ask-review-questions";

export const SEARCH_REVIEW_EVIDENCE_HELP_FINDINGS_HREF = "/governance/findings";

export type SearchReviewEvidenceHelpItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export const SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS: readonly SearchReviewEvidenceHelpItem[] = [
  {
    label: "Workspace index",
    detail: "Search committed review evidence across finalized packages unless you scope to one review.",
    href: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
  },
  {
    label: "Review filter",
    detail: "Optionally limit results to a single architecture review when you already know the package.",
    href: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
  },
  {
    label: "Hit navigation",
    detail: "Open a match, then follow Sources or the evidence trail before briefing sponsors.",
    href: inAppHelpHref("evidence-trail"),
  },
  {
    label: "Ask follow-up",
    detail: "Use Ask review questions when plain-language answers need a selected sealed record.",
    href: SEARCH_REVIEW_EVIDENCE_HELP_ASK_HREF,
  },
] as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS = [
  "Enter a phrase and optionally limit results to one finalized review.",
  "Open a hit to inspect the cited finding, decision, or sealed record context.",
  "Follow evidence graph, findings, or audit trails when search hits need fuller diligence.",
] as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID = "help-search-review-evidence-claim-discipline-heading" as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-search-review-evidence-shows", title: "What search review evidence shows" },
  { level: 2, id: "how-search-review-evidence-works", title: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
    title: SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the diligence negation once. */
export const SEARCH_REVIEW_EVIDENCE_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a sealed-review diligence Sources package", "not a diligence Sources package"],
  claimMustContain: "not a sealed-review diligence Sources package",
} as const;

/** Reserved for nearby-surfaces copy when search needs review intake context. */
export const SEARCH_REVIEW_EVIDENCE_HELP_REVIEWS_LIST_HREF = REVIEWS_LIST_PATH;
