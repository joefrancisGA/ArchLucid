import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
  SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL,
} from "@/lib/search-review-evidence-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/search-review-evidence-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE = "Search review evidence";

export const SEARCH_REVIEW_EVIDENCE_HELP_BREADCRUMB_TOPIC_TITLE = "Search review evidence";

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_EYEBROW = "Help topic" as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE =
  "How to discover findings, decisions, and finalized review records across finalized packages in this workspace.";

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE_BUYER =
  "Find findings and finalized review records across finalized packages in this workspace." as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_CONTENT_ID = "help-search-review-evidence-primary-content" as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_SKIP_LINK_LABEL = "Skip to search review evidence guide" as const;

export function searchReviewEvidenceHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE_BUYER
    : SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE;
}

export const SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW =
  "Enter a phrase to scan finalized review evidence in this workspace. Each hit opens the cited finding, decision, or finalized review record so you can follow the evidence trail before briefing sponsors.";

export const SEARCH_REVIEW_EVIDENCE_HELP_START_HERE_CARD_TITLE = "Open search review evidence";

export const SEARCH_REVIEW_EVIDENCE_HELP_PRECONDITION =
  "Requires at least one finalized architecture review in this workspace.";

export const SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION = {
  label: "Open search review evidence",
  href: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
} as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_EVIDENCE_GRAPH_HREF = "/insights/evidence-graph";

export const SEARCH_REVIEW_EVIDENCE_HELP_ASK_HREF = "/insights/ask-review-questions";

export const SEARCH_REVIEW_EVIDENCE_HELP_FINDINGS_HREF = "/governance/findings";

export const SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_SECTION_ID = "what-search-review-evidence-indexes" as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_TITLE = "What is indexed";

export type SearchReviewEvidenceHelpIndexedRow = {
  readonly term: string;
  readonly detail: string;
};

export const SEARCH_REVIEW_EVIDENCE_HELP_INDEXED_ROWS: readonly SearchReviewEvidenceHelpIndexedRow[] = [
  {
    term: "Indexed object types",
    detail: "Findings, decisions, and finalized review records from finalized architecture packages.",
  },
  {
    term: "Freshness",
    detail: "The workspace index updates after a review is finalized; new hits may lag briefly until indexing completes.",
  },
  {
    term: "Exclusions",
    detail: "Draft reviews, in-flight packages, and unsubmitted intake are not searchable.",
  },
  {
    term: "Workspace visibility",
    detail: "Results respect tenant and workspace scope — you only see packages your role can access.",
  },
] as const;

export type SearchReviewEvidenceHelpItem = {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
};

export const SEARCH_REVIEW_EVIDENCE_HELP_FEATURE_ITEMS: readonly SearchReviewEvidenceHelpItem[] = [
  {
    label: "Workspace index",
    detail: "Search committed review evidence across finalized packages unless you scope to one review.",
  },
  {
    label: "Review filter",
    detail: "Optionally limit results to a single architecture review when you already know the package.",
  },
  {
    label: "Hit navigation",
    detail: "Open a match, then follow Sources or the evidence trail before briefing sponsors.",
  },
  {
    label: "Ask follow-up",
    detail: "Use Ask review questions when plain-language answers need a selected finalized review record.",
    href: SEARCH_REVIEW_EVIDENCE_HELP_ASK_HREF,
  },
] as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_EXAMPLE_QUERY = "PHI boundary";

export type SearchReviewEvidenceHelpHitAnatomyField = {
  readonly label: string;
  readonly description: string;
};

export const SEARCH_REVIEW_EVIDENCE_HELP_HIT_ANATOMY_FIELDS: readonly SearchReviewEvidenceHelpHitAnatomyField[] = [
  {
    label: "Snippet",
    description: "The matched phrase from the indexed finding, decision, or finalized review record.",
  },
  {
    label: "Cited artifact",
    description: "The object type behind the hit — finding, decision, or finalized review record.",
  },
  {
    label: "Review",
    description: "The architecture package that owns the hit, with a link to open that review.",
  },
  {
    label: "Evidence trail link",
    description: "A follow-up into the evidence graph when the hit needs graph context beyond the snippet.",
  },
] as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS = [
  `Try a concrete phrase such as "${SEARCH_REVIEW_EVIDENCE_HELP_EXAMPLE_QUERY}" and optionally limit results to one finalized review.`,
  "Scan each hit's snippet, cited artifact, review link, and evidence trail link before opening deeper surfaces.",
  "Open the cited review or evidence trail when search hits need fuller review records before approval or sponsor briefings.",
] as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID = "help-search-review-evidence-claim-discipline-heading" as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  {
    level: 2,
    id: SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_SECTION_ID,
    title: SEARCH_REVIEW_EVIDENCE_HELP_WHAT_IS_INDEXED_TITLE,
  },
  { level: 2, id: "what-search-review-evidence-shows", title: "What search review evidence shows" },
  { level: 2, id: "how-search-review-evidence-works", title: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
    title: SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the audit-export negation once. */
export const SEARCH_REVIEW_EVIDENCE_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a full audit export", "not a diligence Sources package"],
  claimMustContain: "not a full audit export",
} as const;

/** Reserved for nearby-surfaces copy when search needs review intake context. */
export const SEARCH_REVIEW_EVIDENCE_HELP_REVIEWS_LIST_HREF = REVIEWS_LIST_PATH;
