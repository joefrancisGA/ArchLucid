import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

export const SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH = SEARCH_REVIEW_EVIDENCE_PATH;

export const SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE =
 "Search review evidence returns retrieval snippets across findings, decisions, and signed records — it is a discovery launcher, not a signed-review diligence Sources package. Open the cited review, evidence trail, or audit trail before treating snippets as authoritative.";

export const SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO =
 "Use these follow-ups when search hits need review context, evidence trails, or governance queues.";

export type SearchReviewEvidenceSourceLink = {
 readonly label: string;
 readonly href: string;
};

/** Operator Sources — no self-href to search-review-evidence. */
export const SEARCH_REVIEW_EVIDENCE_SOURCES: readonly SearchReviewEvidenceSourceLink[] = [
 { label: "Architecture reviews", href: "/architecture/reviews" },
 { label: "Findings queue", href: "/governance/findings" },
 { label: "Audit trail", href: "/governance/audit" },
 { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
 { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
