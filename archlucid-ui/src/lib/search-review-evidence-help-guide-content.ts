import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
} from "@/app/(operator)/insights/search-review-evidence/_sections/search-page-copy";
import {
  SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
  SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL,
} from "@/lib/search-review-evidence-evidence-copy";

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_TITLE = SEARCH_PAGE_TITLE;

export const SEARCH_REVIEW_EVIDENCE_HELP_PAGE_SUBTITLE = SEARCH_PAGE_SUBTITLE;

export const SEARCH_REVIEW_EVIDENCE_HELP_OVERVIEW =
  "Search review evidence retrieves snippets across findings, decisions, and signed records in this workspace. Use it to discover review context before opening cited packages, the evidence graph, or governance queues.";

export const SEARCH_REVIEW_EVIDENCE_HELP_PRIMARY_ACTION = {
  label: "Open search review evidence",
  href: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,
} as const;

export type SearchReviewEvidenceHelpItem = {
  readonly label: string;
  readonly detail: string;
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
    detail: "Use Ask review questions when plain-language answers need a selected signed record.",
  },
] as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_HOW_TO_READ_STEPS = [
  "Enter a phrase and optionally limit results to one finalized review.",
  "Open a hit to inspect the cited finding, decision, or signed record context.",
  "Follow evidence graph, findings, or audit trails when search hits need fuller diligence.",
] as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_EVIDENCE_GRAPH_HREF = "/insights/evidence-graph";

export const SEARCH_REVIEW_EVIDENCE_HELP_ASK_HREF = "/insights/ask-review-questions";

export const SEARCH_REVIEW_EVIDENCE_HELP_FINDINGS_HREF = "/governance/findings";

export const SEARCH_REVIEW_EVIDENCE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-search-review-evidence-shows", title: "What search review evidence shows" },
  { level: 2, id: "how-search-review-evidence-works", title: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
