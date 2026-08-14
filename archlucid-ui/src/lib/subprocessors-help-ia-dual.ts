import { DPA_TEMPLATE_HELP_PAGE_TITLE } from "@/lib/dpa-template-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TRUST_CENTER_CANONICAL_PATH } from "@/lib/trust-center-evidence-copy";

export type SubprocessorsHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1753 — explicit job split vs DPA template and Trust Center. */
export const SUBPROCESSORS_HELP_JOB_MATRIX_HEADING = "Register table, DPA schedule, or Trust pack?";

export const SUBPROCESSORS_HELP_JOB_MATRIX_TEST_ID = "help-subprocessors-job-matrix";

export const SUBPROCESSORS_HELP_JOB_MATRIX: readonly SubprocessorsHelpJobMatrixRow[] = [
  {
    label: "This subprocessors register",
    when: "Live subprocessor table, processing roles, and 30-day change notice",
    isCurrent: true,
  },
  {
    label: DPA_TEMPLATE_HELP_PAGE_TITLE,
    href: inAppHelpHref("dpa-template"),
    when: "Contractual data-processing terms and subprocessors schedule for counsel",
  },
  {
    label: "Trust Center",
    href: TRUST_CENTER_CANONICAL_PATH,
    when: "Diligence pack index and downloadable assurance artifacts",
  },
] as const;
