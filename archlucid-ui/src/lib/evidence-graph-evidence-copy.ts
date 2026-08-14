import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

export const EVIDENCE_GRAPH_CANONICAL_PATH = EVIDENCE_GRAPH_PATH;

export const EVIDENCE_GRAPH_HELP_TOPIC_LABEL = "How the evidence graph works";

export const EVIDENCE_GRAPH_CLAIM_DISCIPLINE =
  "The evidence graph visualizes how evidence connects to findings, decisions, approvals, and audit records for a finalized review — it is not a sealed-review diligence Sources package.";

export const EVIDENCE_GRAPH_SOURCES_INTRO =
  "Use these follow-ups when graph exploration needs review intake, search, compare, or evidence-trail methodology.";

/** Operator Sources — no self-href to `/insights/evidence-graph`. */
export const EVIDENCE_GRAPH_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Evidence trail help", href: "/help/evidence-trail" },
  { label: "Start a review", href: "/architecture/reviews/new" },
] as const;
