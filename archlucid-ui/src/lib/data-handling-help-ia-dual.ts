import { DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE } from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type DataHandlingHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

/** TB-1652 — explicit job split vs Security and trust assurance hub. */
export const DATA_HANDLING_HELP_IA_DUAL_HEADING = "Which data diligence guide?";

/** TB-1652 — inbound link label on security-trust (distinct from data-handling page title). */
export const DATA_HANDLING_HELP_IA_DUAL_INBOUND_LABEL = "Data handling and tenant isolation";

export const DATA_HANDLING_HELP_JOB_MATRIX_TEST_ID = "help-data-handling-job-matrix";

export const DATA_HANDLING_HELP_JOB_MATRIX: readonly DataHandlingHelpJobMatrixRow[] = [
  {
    label: "This data handling and tenant isolation guide",
    when: "Data flow, what leaves vs stays in your tenant, and three-layer isolation orientation",
    isCurrent: true,
  },
  {
    label: "Security and trust",
    href: inAppHelpHref("security-trust"),
    when: "Assurance index, procurement pack workflow, and isolation evidence for reviewers",
  },
] as const;

export const SECURITY_TRUST_HELP_DATA_HANDLING_IA_DUAL_LABEL = DATA_HANDLING_HELP_IA_DUAL_INBOUND_LABEL;

export const SECURITY_TRUST_HELP_DATA_HANDLING_IA_DUAL_HREF = DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH;

/** Canonical slug absorbs retired `/help/data-handling-tenant-isolation` bookmarks (TB-1652). */
export const DATA_HANDLING_TENANT_ISOLATION_RETIRED_SLUG = "data-handling-tenant-isolation" as const;

export const DATA_HANDLING_HELP_CANONICAL_TITLE = DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE;
