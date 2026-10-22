import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";

export type ReportAProblemHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1743 — explicit job split vs troubleshooting and Support workspace. */
export const REPORT_A_PROBLEM_HELP_JOB_MATRIX_HEADING = "Try fixes first or escalate with structured intake?";

export const REPORT_A_PROBLEM_HELP_JOB_MATRIX_TEST_ID = "help-report-a-problem-job-matrix";

export const REPORT_A_PROBLEM_HELP_JOB_MATRIX: readonly ReportAProblemHelpJobMatrixRow[] = [
  {
    label: TROUBLESHOOTING_HELP_TOPIC_LABEL,
    href: inAppHelpHref("troubleshooting"),
    when: "Recoverable symptoms — refresh, workspace checks, system health, and support bundle download",
  },
  {
    label: "This support intake guide",
    when: "Structured context when Report problem is on a high-stakes failure page",
    isCurrent: true,
  },
  {
    label: "Support workspace",
    href: SETTINGS_SUPPORT_PATH,
    when: "Bundle download and email templates when Report problem is unavailable (administrators)",
  },
] as const;
