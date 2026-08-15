import { PROCUREMENT_HELP_PAGE_TITLE } from "@/lib/procurement-help-guide-content";
import { SECURITY_TRUST_HELP_TOPIC_LABEL } from "@/lib/security-trust-help-evidence-copy";
import { SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE } from "@/lib/soc2-self-assessment-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ProcurementHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-2274 — explicit job split vs assurance ladder and SOC 2 posture help. */
export const PROCUREMENT_HELP_JOB_MATRIX_HEADING =
  "Assurance ladder, SOC 2 posture, or procurement questionnaire answers?";

export const PROCUREMENT_HELP_JOB_MATRIX_TEST_ID = "help-procurement-job-matrix";

export const PROCUREMENT_HELP_JOB_MATRIX: readonly ProcurementHelpJobMatrixRow[] = [
  {
    label: SECURITY_TRUST_HELP_TOPIC_LABEL,
    href: inAppHelpHref("security-trust"),
    when: "Assurance ladder, data handling, and trust-center orientation — not FAQ copy-paste answers",
  },
  {
    label: SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
    href: inAppHelpHref("soc2-self-assessment"),
    when: "SOC 2 self-assessment posture and CPA realism — not the full procurement questionnaire",
  },
  {
    label: PROCUREMENT_HELP_PAGE_TITLE,
    when: "Buyer-safe FAQ answers for InfoSec questionnaires, resilience reviews, and diligence CTAs",
    isCurrent: true,
  },
] as const;
