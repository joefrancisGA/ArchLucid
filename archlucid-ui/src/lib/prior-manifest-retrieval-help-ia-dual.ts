import { COMPARISON_REPLAY_HELP_CANONICAL_PATH } from "@/lib/comparison-replay-help-evidence-copy";
import { COMPARISON_REPLAY_HELP_IA_DUAL_INBOUND_LABEL } from "@/lib/compare-repeat-review-help-ia-dual";
import { REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH } from "@/lib/repeat-review-loop-help-evidence-copy";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";

export type PriorManifestRetrievalHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1734 — explicit job split vs repeat-review-loop and comparison-replay. */
export const PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_HEADING = "Which memory or second-review guide?";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX_TEST_ID = "help-prior-manifest-retrieval-job-matrix";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_JOB_MATRIX: readonly PriorManifestRetrievalHelpJobMatrixRow[] = [
  {
    label: "This Ask memory guide",
    when: "What finalize indexes for conversational answers — select a signed record and ask in plain language",
    isCurrent: true,
  },
  {
    label: REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
    href: REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH,
    when: "Second-review habit loop after the first finalize — compare, replay, governance dry-run, and sponsor proof",
  },
  {
    label: COMPARISON_REPLAY_HELP_IA_DUAL_INBOUND_LABEL,
    href: COMPARISON_REPLAY_HELP_CANONICAL_PATH,
    when: "Side-by-side diffs between packages or replaying a saved comparison record",
  },
] as const;
