import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH = SEARCH_REVIEW_EVIDENCE_PATH;

export const SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL = "How to search review evidence";

export const SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE =
 "Search review evidence returns snippets across findings, decisions, and sealed records — not a full audit export. Open the cited review, Evidence trail, or Audit before treating results as official.";

export const SEARCH_REVIEW_EVIDENCE_CLAIM_HEADING = "Retrieval launcher only" as const;

export const SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO =
 "Use these follow-ups when search hits need review context, evidence trails, or governance queues.";


/** Operator Sources — no self-href to search-review-evidence. */
export const SEARCH_REVIEW_EVIDENCE_SOURCES: readonly EvidenceSourceLink[] = [
 { label: "Architecture reviews", href: "/architecture/reviews" },
 { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
 { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
 { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
 { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
