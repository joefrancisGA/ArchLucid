import { COMPARISON_REPLAY_HELP_CANONICAL_PATH } from "@/lib/comparison-replay-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";
import { REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH } from "@/lib/repeat-review-loop-help-evidence-copy";

export type CompareRepeatReviewHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1638 — explicit job split vs repeat-review-loop stickiness checklist. */
export const COMPARE_REPEAT_REVIEW_HELP_JOB_MATRIX_HEADING = "Which second-review help guide?";

/** TB-1638 — inbound link label on repeat-review-loop (distinct from compare page title). */
export const COMPARISON_REPLAY_HELP_IA_DUAL_INBOUND_LABEL = "Compare and replay mechanics";

export const COMPARISON_REPLAY_HELP_JOB_MATRIX_TEST_ID = "help-comparison-replay-job-matrix";

export const COMPARISON_REPLAY_HELP_JOB_MATRIX: readonly CompareRepeatReviewHelpJobMatrixRow[] = [
  {
    label: REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
    href: REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH,
    when: "Second-review habit loop after the first finalize — policy dry-run, second finalize, and sponsor proof",
  },
  {
    label: "This Compare and replay guide",
    when: "Compare and replay mechanics — side-by-side deltas between packages or regenerating a saved comparison record",
    isCurrent: true,
  },
] as const;

export const REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX_TEST_ID = "help-repeat-review-loop-job-matrix";

export const REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX: readonly CompareRepeatReviewHelpJobMatrixRow[] = [
  {
    label: COMPARISON_REPLAY_HELP_IA_DUAL_INBOUND_LABEL,
    href: COMPARISON_REPLAY_HELP_CANONICAL_PATH,
    when: "Diff two architecture packages and replay or validate a saved comparison record",
  },
  {
    label: "This repeat architecture review guide",
    when: "Second-review habit loop checklist — compare, replay, governance, finalize again, and collect proof",
    isCurrent: true,
  },
] as const;
