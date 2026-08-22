import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";

export type CorePilotHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1683 — explicit job split vs retired core-pilot / evidence-only-review aliases (both fold to COR). */
export const CORE_PILOT_HELP_IA_DUAL_HEADING = "Which first-review help path?";

/** TB-1683 — inbound link label for the full guided path (distinct from evidence-only fast path). */
export const CORE_PILOT_HELP_IA_DUAL_INBOUND_LABEL = FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE;

/** TB-1683 — inbound link label on the full guide for the evidence-only fast-path anchor. */
export const EVIDENCE_ONLY_REVIEW_HELP_IA_DUAL_INBOUND_LABEL = "Evidence-only fast path";

export const CORE_PILOT_HELP_FIRST_REVIEW_PATH_ANCHOR = "first-review-path" as const;

export const EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_ANCHOR = "fast-path-evidence-only-review" as const;

export const CORE_PILOT_HELP_JOB_MATRIX_TEST_ID = "help-core-pilot-job-matrix";

export const CORE_PILOT_HELP_FULL_REVIEW_PATH_HREF =
  `${FIRST_ARCHITECTURE_REVIEW_HELP_PATH}#${CORE_PILOT_HELP_FIRST_REVIEW_PATH_ANCHOR}` as const;

export const EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF =
  `${FIRST_ARCHITECTURE_REVIEW_HELP_PATH}#${EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_ANCHOR}` as const;

export const CORE_PILOT_HELP_JOB_MATRIX: readonly CorePilotHelpJobMatrixRow[] = [
  {
    label: "This guide",
    when: "Full guided five-step path — start review, add evidence, monitor, finalize, and share outputs (cloud connectors optional)",
    isCurrent: true,
  },
  {
    label: EVIDENCE_ONLY_REVIEW_HELP_IA_DUAL_INBOUND_LABEL,
    href: EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF,
    when: "Connectors not approved yet — start with briefs, diagrams, documents, IaC, or exports only",
  },
] as const;
