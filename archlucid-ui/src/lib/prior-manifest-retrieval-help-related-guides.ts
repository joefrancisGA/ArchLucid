import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { ASK_REVIEW_QUESTIONS_CANONICAL_PATH } from "@/lib/ask-review-questions-evidence-copy";
import { resolveRelatedFollowUpsTitle } from "@/lib/help/related-follow-ups-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";
import { REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH } from "@/lib/repeat-review-loop-help-evidence-copy";

/** TB-1735 — at most three related guides for the Ask-memory job. */
export const PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: "Open Ask review questions", href: ASK_REVIEW_QUESTIONS_CANONICAL_PATH },
  { label: REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE, href: REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH },
  { label: "Architecture packages", href: inAppHelpHref("review-packages") },
] as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_HEADING = resolveRelatedFollowUpsTitle(
  PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_GUIDES,
);

export const PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_TEST_ID = "help-prior-manifest-retrieval-related-help";

/** Related guides for `/help/prior-manifest-retrieval`. */
export function priorManifestRetrievalHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_GUIDES;
}
