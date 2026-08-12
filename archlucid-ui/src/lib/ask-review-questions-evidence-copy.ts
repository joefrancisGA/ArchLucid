import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const ASK_REVIEW_QUESTIONS_CANONICAL_PATH = "/insights/ask-review-questions" as const;

export const ASK_REVIEW_QUESTIONS_CLAIM_DISCIPLINE =
  "Ask review questions grounds answers in a selected signed review record — it is not a complete diligence Sources export package by itself. Open cited findings, Evidence graph, or Audit when you need fuller sponsor-safe trails.";

export const ASK_REVIEW_QUESTIONS_SOURCES_INTRO =
  "Use these follow-ups when answers need package context, evidence search, or governance disposition.";


/** Operator Sources — no self-href to Ask. */
export const ASK_REVIEW_QUESTIONS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
  { label: "Evidence graph", href: "/insights/evidence-graph" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
] as const;
