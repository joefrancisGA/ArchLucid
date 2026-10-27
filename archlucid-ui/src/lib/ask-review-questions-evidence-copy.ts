import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { resolveWorkingArchitecturePortfolioParentLink } from "@/lib/resolve-working-evidence-parent-link";
import {
  askReviewArtifactStatusCopy,
  type AskReviewArtifactStatus,
} from "@/lib/ask-review-artifact-status-copy";

export const ASK_REVIEW_QUESTIONS_CANONICAL_PATH = "/insights/ask-review-questions" as const;

const ASK_REVIEW_QUESTIONS_CLAIM_FOLLOW_UP =
  "Open cited findings, Evidence graph, or Audit when you need the full package." as const;

export const ASK_REVIEW_QUESTIONS_FINALIZED_CLAIM_DISCIPLINE =
  "Ask review questions grounds answers in a selected finalized review record — not a complete audit export by itself." as const;

export const ASK_REVIEW_QUESTIONS_CLAIM_DISCIPLINE =
  `${ASK_REVIEW_QUESTIONS_FINALIZED_CLAIM_DISCIPLINE} ${ASK_REVIEW_QUESTIONS_CLAIM_FOLLOW_UP}`;

export function resolveAskReviewQuestionsHeaderClaimDiscipline(
  status: AskReviewArtifactStatus,
): string {
  if (status === "finalized") {
    return ASK_REVIEW_QUESTIONS_CLAIM_DISCIPLINE;
  }

  return askReviewArtifactStatusCopy(status);
}

export const ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const ASK_REVIEW_QUESTIONS_SOURCES_INTRO =
  "Use these follow-ups when answers need package context, evidence search, or findings triage.";


/** Operator Sources — no self-href to Ask. */
export function buildAskReviewQuestionsSources(
  workingMode: boolean,
): readonly EvidenceSourceLink[] {
  const reviewsParent = resolveWorkingArchitecturePortfolioParentLink(workingMode);

  return [
    { label: reviewsParent.label, href: reviewsParent.href },
    { label: "Evidence graph", href: "/insights/evidence-graph" },
    { label: "Search review evidence", href: "/insights/search-review-evidence" },
    { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  ] as const;
}

/** Guided default — prefer {@link buildAskReviewQuestionsSources}. */
export const ASK_REVIEW_QUESTIONS_SOURCES: readonly EvidenceSourceLink[] =
  buildAskReviewQuestionsSources(false);
