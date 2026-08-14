import { ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL } from "@/lib/admin-diagnostics-help-evidence-copy";
import { ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE } from "@/lib/engineering-troubleshooting-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";

export type EngineeringTroubleshootingHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-2265 — explicit job split vs customer troubleshooting and admin diagnostics. */
export const ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_HEADING =
  "Customer self-serve, live signals, or eng-depth runbook?";

export const ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_TEST_ID =
  "help-engineering-troubleshooting-job-matrix";

export const ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX: readonly EngineeringTroubleshootingHelpJobMatrixRow[] =
  [
    {
      label: TROUBLESHOOTING_HELP_TOPIC_LABEL,
      href: inAppHelpHref("troubleshooting"),
      when: "Recoverable operator symptoms — refresh, workspace checks, and support bundle download",
    },
    {
      label: ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL,
      href: inAppHelpHref("admin-diagnostics"),
      when: "Live platform-health signals and readiness checks before eng-depth triage",
    },
    {
      label: ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE,
      when: "CLI, migration, proxy, and auth-depth triage after customer paths are exhausted",
      isCurrent: true,
    },
  ] as const;
